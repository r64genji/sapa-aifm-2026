create or replace function dispatch_claim(at timestamptz)
returns table (schedule_id uuid, chat_id bigint, language text, progress int, kind text)
language plpgsql
set search_path = public
as $$
begin
  update checkin_schedule s set status = 'skipped'
  where (s.status = 'scheduled' and s.due_at + interval '48 hours' <= org_now(s.organisation_id, at))
     or (s.status = 'reminded' and s.reminder_at + interval '24 hours' <= org_now(s.organisation_id, at));

  return query
  with due as (
    select s.id
    from checkin_schedule s
    join organisations o on o.id = s.organisation_id
    join people p on p.id = s.person_id
    where s.status = 'sent'
      and s.sent_at + interval '24 hours' <= org_now(o.id, at)
      and p.state = 'active' and not p.synthetic and p.telegram_chat_id is not null
      and exists (select 1 from consents c where c.person_id = p.id and c.withdrawn_at is null)
      and (o.demo_mode or (
        extract(isodow from org_now(o.id, at) at time zone o.time_zone) <= 5
        and extract(hour from org_now(o.id, at) at time zone o.time_zone) between 9 and 16))
    for update of s skip locked
  )
  update checkin_schedule s
  set status = 'reminded', reminder_at = org_now(s.organisation_id, at)
  from due, people p
  where s.id = due.id and p.id = s.person_id
  returning s.id, p.telegram_chat_id, p.language, s.progress, 'reminder'::text;

  update checkin_schedule s set status = 'skipped'
  from organisations o
  where o.id = s.organisation_id
    and s.status = 'sent'
    and s.sent_at + interval '48 hours' <= org_now(o.id, at)
    and (o.demo_mode or (
      extract(isodow from org_now(o.id, at) at time zone o.time_zone) <= 5
      and extract(hour from org_now(o.id, at) at time zone o.time_zone) between 9 and 16));

  return query
  with due as (
    select s.id
    from checkin_schedule s
    join organisations o on o.id = s.organisation_id
    join people p on p.id = s.person_id
    where s.status = 'scheduled'
      and p.state = 'active' and not p.synthetic and p.telegram_chat_id is not null
      and exists (select 1 from consents c where c.person_id = p.id and c.withdrawn_at is null)
      and case when o.demo_mode
        then (s.due_at at time zone o.time_zone)::date <= (org_now(o.id, at) at time zone o.time_zone)::date
        else s.due_at <= at
          and extract(isodow from at at time zone o.time_zone) <= 5
          and extract(hour from at at time zone o.time_zone) between 9 and 16
      end
    for update of s skip locked
  )
  update checkin_schedule s
  set status = 'sent', sent_at = org_now(s.organisation_id, at)
  from due, people p
  where s.id = due.id and p.id = s.person_id
  returning s.id, p.telegram_chat_id, p.language, s.progress, 'checkin'::text;
end;
$$;

create or replace function delete_person(person uuid, at timestamptz) returns boolean
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
  delete from audit_log where target = person::text;
  insert into audit_log (actor, action, target, at) values ('new_hire', 'delete_own_data', '', at);
  return true;
end;
$$;
