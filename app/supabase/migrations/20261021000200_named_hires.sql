alter table people add column name text, add column awaiting_name boolean default false;

alter table organisations drop constraint organisations_min_group_size_check;
alter table organisations alter column min_group_size set default 1;
update organisations set min_group_size = 1;

create or replace function delete_person(person uuid, at timestamptz) returns boolean
language plpgsql
set search_path = public
as $$
begin
  update people set state = 'deleted', deleted_at = at, telegram_chat_id = null, name = null
  where id = person and state <> 'deleted';
  if not found then
    return false;
  end if;
  delete from responses where person_id = person;
  delete from checkin_schedule where person_id = person;
  delete from asked_questions where person_id = person;
  delete from follow_up_offers where person_id = person;
  delete from consents where person_id = person;
  delete from audit_log where target = person::text;
  insert into audit_log (actor, action, target, at) values ('new_hire', 'delete_own_data', '', at);
  return true;
end;
$$;
