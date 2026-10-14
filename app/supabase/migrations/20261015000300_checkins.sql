alter table people add column synthetic boolean not null default false;

create table checkin_schedule (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations on delete cascade,
  person_id uuid not null references people on delete cascade,
  touchpoint int not null,
  due_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'sent', 'answered', 'reminded', 'skipped')),
  progress int not null default 0,
  sent_at timestamptz,
  reminder_at timestamptz,
  unique (person_id, touchpoint)
);

create table responses (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations on delete cascade,
  person_id uuid not null references people on delete cascade,
  schedule_id uuid references checkin_schedule on delete cascade,
  question_id text not null,
  scale_value int check (scale_value between 1 and 5),
  text_encrypted text,
  language text not null,
  kind text not null default 'checkin' check (kind in ('checkin', 'unprompted', 'exit')),
  created_at timestamptz not null
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  target text not null,
  at timestamptz not null
);

alter table checkin_schedule enable row level security;
alter table responses enable row level security;
alter table audit_log enable row level security;

create function org_now(org uuid, at timestamptz) returns timestamptz
language sql stable
set search_path = public
as $$
  select at + case when demo_mode then demo_offset_days * interval '1 day' else interval '0' end
  from organisations where id = org;
$$;

create function write_schedule(person uuid, at timestamptz) returns void
language sql
set search_path = public
as $$
  insert into checkin_schedule (organisation_id, person_id, touchpoint, due_at)
  select p.organisation_id, p.id, t.day, slot.due_at
  from people p
  join organisations o on o.id = p.organisation_id,
  unnest(array[3, 7, 14, 30, 60, 90, 182]) as t(day),
  lateral (
    select ((p.start_date + t.day)
      + case extract(isodow from p.start_date + t.day) when 6 then 2 when 7 then 1 else 0 end
      + time '10:00') at time zone o.time_zone as due_at
  ) slot
  where p.id = person and slot.due_at > org_now(p.organisation_id, at)
  on conflict (person_id, touchpoint) do nothing;
$$;

create function dispatch_claim(at timestamptz)
returns table (schedule_id uuid, chat_id bigint, language text, progress int, kind text)
language plpgsql
set search_path = public
as $$
begin
  update checkin_schedule s set status = 'skipped'
  where (s.status = 'scheduled' and s.due_at + interval '48 hours' <= org_now(s.organisation_id, at))
     or (s.status = 'sent' and s.sent_at + interval '48 hours' <= org_now(s.organisation_id, at))
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

revoke execute on function org_now(uuid, timestamptz) from public, anon, authenticated;
revoke execute on function write_schedule(uuid, timestamptz) from public, anon, authenticated;
revoke execute on function dispatch_claim(timestamptz) from public, anon, authenticated;
grant execute on function org_now(uuid, timestamptz) to service_role;
grant execute on function write_schedule(uuid, timestamptz) to service_role;
grant execute on function dispatch_claim(timestamptz) to service_role;

create or replace function reset_demo(seed jsonb) returns void
language plpgsql
set search_path = public
as $$
begin
  truncate organisations, inbound_updates, audit_log cascade;
  insert into organisations select * from jsonb_populate_recordset(null::organisations, seed->'organisations');
  insert into language_packs select * from jsonb_populate_recordset(null::language_packs, seed->'language_packs');
  insert into managers select * from jsonb_populate_recordset(null::managers, seed->'managers');
  insert into people select * from jsonb_populate_recordset(null::people, seed->'people');
  insert into consents select * from jsonb_populate_recordset(null::consents, seed->'consents');
  insert into checkin_schedule select * from jsonb_populate_recordset(null::checkin_schedule, seed->'checkin_schedule');
end;
$$;
