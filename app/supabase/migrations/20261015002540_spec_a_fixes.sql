create or replace function retention_end(person uuid) returns timestamptz
language sql stable
set search_path = public
as $$
  select coalesce(greatest(
    (select max(s.sent_at) from checkin_schedule s where s.person_id = p.id),
    (select max(r.created_at) from responses r where r.person_id = p.id and r.kind <> 'exit'),
    (select max(q.created_at) from asked_questions q where q.person_id = p.id)
  ), p.left_at) + o.retention_days * interval '1 day'
  from people p join organisations o on o.id = p.organisation_id
  where p.id = person;
$$;

create or replace function mark_left(person uuid, reason text, at timestamptz) returns boolean
language plpgsql
set search_path = public
as $$
declare
  org uuid;
  now_at timestamptz;
begin
  select organisation_id into org from people where id = person and left_at is null for update;
  if org is null then return false; end if;
  now_at := org_now(org, at);
  update people set left_reason = reason, left_at = now_at,
    state = case when state in ('active', 'invited', 'consent_shown') then 'left' else state end,
    end_sent_at = case when state in ('invited', 'consent_shown') then now_at else end_sent_at end
  where id = person;
  delete from checkin_schedule where person_id = person and status = 'scheduled';
  update checkin_schedule set status = 'skipped' where person_id = person and status in ('sent', 'reminded');
  update follow_up_offers set answer = 'none', closed_at = now_at where person_id = person and closed_at is null;
  return true;
end;
$$;

create or replace function left_claim(at timestamptz)
returns table (chat_id bigint, language text, end_date text, ask_exit boolean)
language plpgsql
set search_path = public
as $$
begin
  return query
  with due as (
    select p.id
    from people p
    join organisations o on o.id = p.organisation_id
    where p.state = 'left' and p.end_sent_at is null and not p.synthetic and p.telegram_chat_id is not null
      and (o.demo_mode or working_hour(o, at))
    for update of p skip locked
  )
  update people p
  set end_sent_at = org_now(p.organisation_id, at),
      exit_asked_at = case when p.left_reason = 'resigned' and p.exit_ok is true
        then org_now(p.organisation_id, at) end
  from due, organisations o
  where p.id = due.id and o.id = p.organisation_id
  returning p.telegram_chat_id, p.language,
    to_char(retention_end(p.id) at time zone o.time_zone, 'YYYY-MM-DD'),
    p.exit_asked_at is not null;
end;
$$;

create or replace function purge_raw_text(at timestamptz) returns int
language plpgsql
set search_path = public
as $$
declare
  expired uuid[];
  purged int;
begin
  select coalesce(array_agg(p.id), '{}') into expired
  from people p
  join organisations o on o.id = p.organisation_id
  where retention_end(p.id) <= org_now(o.id, at);

  update ai_tags t set evidence_quote = null
  from responses r
  where r.id = t.response_id and r.person_id = any(expired) and t.evidence_quote is not null;

  update responses set text_encrypted = null
  where person_id = any(expired) and text_encrypted is not null;
  get diagnostics purged = row_count;

  update asked_questions set text_encrypted = null, answer_encrypted = null
  where person_id = any(expired) and (text_encrypted is not null or answer_encrypted is not null);

  return purged;
end;
$$;

revoke execute on function retention_end(uuid) from public, anon, authenticated;
grant execute on function retention_end(uuid) to service_role;
