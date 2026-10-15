alter table people add column left_at timestamptz;

create table milestone_nudges (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations on delete cascade,
  manager_id uuid not null references managers on delete cascade,
  person_id uuid not null references people on delete cascade,
  day int not null check (day in (1, 7, 30)),
  sent_at timestamptz not null,
  done_at timestamptz,
  unique (person_id, day)
);

alter table milestone_nudges enable row level security;

create function milestones_claim(at timestamptz)
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
      and extract(isodow from at at time zone o.time_zone) <= 5
      and extract(hour from at at time zone o.time_zone) between 9 and 16
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

revoke execute on function milestones_claim(timestamptz) from public, anon, authenticated;
grant execute on function milestones_claim(timestamptz) to service_role;
