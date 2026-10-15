alter table organisations add column holidays date[] not null default '{}';

create function working_hour(o organisations, t timestamptz) returns boolean
language sql stable
set search_path = public
as $$
  select extract(isodow from t at time zone o.time_zone) <= 5
    and extract(hour from t at time zone o.time_zone) between 9 and 16
    and (t at time zone o.time_zone)::date <> all(o.holidays);
$$;

revoke execute on function working_hour(organisations, timestamptz) from public, anon, authenticated;
grant execute on function working_hour(organisations, timestamptz) to service_role;

create or replace function write_schedule(person uuid, at timestamptz) returns void
language sql
set search_path = public
as $$
  insert into checkin_schedule (organisation_id, person_id, touchpoint, due_at)
  select p.organisation_id, p.id, t.day, slot.due_at
  from people p
  join organisations o on o.id = p.organisation_id,
  unnest(array[3, 7, 14, 30, 60, 90, 182]) as t(day),
  lateral (
    select min(d)::date as day
    from generate_series((p.start_date + t.day)::timestamp, (p.start_date + t.day + 30)::timestamp, interval '1 day') d
    where extract(isodow from d) <= 5 and d::date <> all(o.holidays)
  ) w,
  lateral (select (w.day + time '10:00') at time zone o.time_zone as due_at) slot
  where p.id = person and slot.due_at > org_now(p.organisation_id, at)
  on conflict (person_id, touchpoint) do nothing;
$$;

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
      and (o.demo_mode or working_hour(o, org_now(o.id, at)))
    for update of s skip locked
  )
  update checkin_schedule s
  set status = 'reminded', reminder_at = org_now(s.organisation_id, at)
  from due, people p
  where s.id = due.id and p.id = s.person_id
  returning s.id, p.telegram_chat_id, p.language, s.progress, 'reminder'::text;

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
        else s.due_at <= at and working_hour(o, at)
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

create or replace function offers_claim(at timestamptz)
returns table (chat_id bigint, language text)
language plpgsql
set search_path = public
as $$
begin
  update follow_up_offers f
  set answer = 'none', closed_at = org_now(f.organisation_id, at)
  where f.sent_at is not null and f.closed_at is null
    and f.sent_at + interval '7 days' <= org_now(f.organisation_id, at);

  return query
  with due as (
    select f.id
    from follow_up_offers f
    join organisations o on o.id = f.organisation_id
    join people p on p.id = f.person_id
    where f.sent_at is null and f.closed_at is null
      and p.state = 'active' and not p.synthetic and p.telegram_chat_id is not null
      and (o.demo_mode or working_hour(o, at))
    for update of f skip locked
  )
  update follow_up_offers f
  set sent_at = org_now(f.organisation_id, at)
  from due, people p
  where f.id = due.id and p.id = f.person_id
  returning p.telegram_chat_id, p.language;
end;
$$;

create or replace function milestones_claim(at timestamptz)
returns table (id uuid, chat_id bigint, language text, day int, hire text)
language sql
set search_path = public
as $$
  with due as (
    select p.organisation_id, m.id as manager_id, m.telegram_chat_id, p.id as person_id, p.code_name,
      o.hr_language, d.day
    from people p
    join organisations o on o.id = p.organisation_id
    join managers m on m.id = p.manager_id and m.telegram_chat_id is not null and m.revoked_at is null
    cross join unnest(array[1, 7, 30]) as d(day)
    where not p.synthetic and p.left_at is null and not o.demo_mode
      and working_hour(o, at)
      and p.start_date + d.day <= (at at time zone o.time_zone)::date
      and p.start_date + d.day > (at at time zone o.time_zone)::date - 3
  ),
  added as (
    insert into milestone_nudges (organisation_id, manager_id, person_id, day, sent_at)
    select organisation_id, manager_id, person_id, day, at from due
    on conflict (person_id, day) do nothing
    returning milestone_nudges.id, milestone_nudges.person_id, milestone_nudges.day
  )
  select a.id, d.telegram_chat_id, d.hr_language, a.day, d.code_name
  from added a
  join due d on d.person_id = a.person_id and d.day = a.day
  order by d.code_name, a.day;
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
    to_char((p.left_at + o.retention_days * interval '1 day') at time zone o.time_zone, 'YYYY-MM-DD'),
    p.exit_asked_at is not null;
end;
$$;

create or replace function notices_claim(at timestamptz)
returns table (chat_id bigint, language text, note text)
language plpgsql
set search_path = public
as $$
begin
  delete from notices n using people p
  where p.id = n.person_id and n.sent_at is null
    and (p.state <> 'active'
      or not exists (select 1 from consents c where c.person_id = p.id and c.withdrawn_at is null));

  return query
  with due as (
    select n.id
    from notices n
    join organisations o on o.id = n.organisation_id
    join people p on p.id = n.person_id
    where n.sent_at is null
      and p.state = 'active' and not p.synthetic and p.telegram_chat_id is not null
      and (o.demo_mode or working_hour(o, at))
    for update of n skip locked
  )
  update notices n
  set sent_at = org_now(n.organisation_id, at)
  from due, people p, actions a
  where n.id = due.id and p.id = n.person_id and a.id = n.action_id
  returning p.telegram_chat_id, p.language, coalesce(a.notes ->> p.language, a.notes ->> 'en');
end;
$$;
