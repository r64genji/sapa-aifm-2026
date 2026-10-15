alter table people drop constraint people_state_check;
alter table people add constraint people_state_check
  check (state in ('invited', 'consent_shown', 'declined', 'active', 'stopped', 'left'));

alter table people
  add column left_reason text check (left_reason in ('resigned', 'ended_by_company')),
  add column if not exists left_at timestamptz,
  add column exit_ok boolean,
  add column end_sent_at timestamptz,
  add column exit_asked_at timestamptz;

create function mark_left(person uuid, reason text, at timestamptz) returns boolean
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
    state = case when state = 'active' then 'left' else state end
  where id = person;
  delete from checkin_schedule where person_id = person and status = 'scheduled';
  update checkin_schedule set status = 'skipped' where person_id = person and status in ('sent', 'reminded');
  update follow_up_offers set answer = 'none', closed_at = now_at where person_id = person and closed_at is null;
  return true;
end;
$$;

create function left_claim(at timestamptz)
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
      and (o.demo_mode or (
        extract(isodow from at at time zone o.time_zone) <= 5
        and extract(hour from at at time zone o.time_zone) between 9 and 16))
    for update of p skip locked
  )
  update people p
  set end_sent_at = org_now(p.organisation_id, at),
      exit_asked_at = case when p.left_reason = 'resigned' and p.exit_ok is true
        then org_now(p.organisation_id, at) end
  from due, organisations o
  where p.id = due.id and o.id = p.organisation_id
  returning p.telegram_chat_id, p.language,
    to_char((p.left_at + o.retention_days * interval '1 day') at time zone o.time_zone, 'YYYY-MM-DD'),
    p.exit_asked_at is not null;
end;
$$;

revoke execute on function mark_left(uuid, text, timestamptz) from public, anon, authenticated;
revoke execute on function left_claim(timestamptz) from public, anon, authenticated;
grant execute on function mark_left(uuid, text, timestamptz) to service_role;
grant execute on function left_claim(timestamptz) to service_role;
