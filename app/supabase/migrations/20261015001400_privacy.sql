alter table people drop constraint people_state_check;
alter table people add constraint people_state_check
  check (state in ('invited', 'consent_shown', 'declined', 'active', 'stopped', 'deleted'));
alter table people add column deleted_at timestamptz;

alter table ai_tags
  add column changed_by_hr boolean default false,
  add column challenged_at timestamptz,
  add column challenge_resolved_at timestamptz;

alter table audit_log add column reason text;

create function delete_person(person uuid, at timestamptz) returns boolean
language plpgsql
set search_path = public
as $$
begin
  update people set state = 'deleted', deleted_at = at, telegram_chat_id = null
  where id = person and state <> 'deleted';
  if not found then
    return false;
  end if;
  delete from responses where person_id = person;
  delete from checkin_schedule where person_id = person;
  delete from asked_questions where person_id = person;
  delete from follow_up_offers where person_id = person;
  delete from consents where person_id = person;
  insert into audit_log (actor, action, target, at) values ('new_hire', 'delete_own_data', '', at);
  return true;
end;
$$;

create function purge_raw_text(at timestamptz) returns int
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
  where greatest(
    (select max(s.sent_at) from checkin_schedule s where s.person_id = p.id),
    (select max(r.created_at) from responses r where r.person_id = p.id),
    (select max(q.created_at) from asked_questions q where q.person_id = p.id)
  ) + o.retention_days * interval '1 day' <= org_now(o.id, at);

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

revoke execute on function delete_person(uuid, timestamptz) from public, anon, authenticated;
revoke execute on function purge_raw_text(timestamptz) from public, anon, authenticated;
grant execute on function delete_person(uuid, timestamptz) to service_role;
grant execute on function purge_raw_text(timestamptz) to service_role;
