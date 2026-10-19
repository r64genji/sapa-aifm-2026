alter table people add column joined_on date;
alter table checkin_schedule add column questions text[];

create table checkin_tracks (
  organisation_id uuid not null references organisations on delete cascade,
  id text not null check (id in ('new_hire', 'employee')),
  name text not null,
  days int[] not null,
  questions text[] not null,
  primary key (organisation_id, id)
);

alter table checkin_tracks enable row level security;

drop function write_schedule(uuid, timestamptz);

create function write_schedule(person uuid, at timestamptz, days int[]) returns void
language sql
set search_path = public
as $$
  insert into checkin_schedule (organisation_id, person_id, touchpoint, due_at)
  select p.organisation_id, p.id, t.day, slot.due_at
  from people p
  join organisations o on o.id = p.organisation_id,
  unnest(days) as t(day),
  lateral (
    select min(d)::date as day
    from generate_series((coalesce(p.joined_on, p.start_date) + t.day)::timestamp, (coalesce(p.joined_on, p.start_date) + t.day + 30)::timestamp, interval '1 day') d
    where extract(isodow from d) <= 5 and d::date <> all(o.holidays)
  ) w,
  lateral (select (w.day + time '10:00') at time zone o.time_zone as due_at) slot
  where p.id = person and slot.due_at > org_now(p.organisation_id, at)
  on conflict (person_id, touchpoint) do nothing;
$$;

revoke execute on function write_schedule(uuid, timestamptz, int[]) from public, anon, authenticated;
grant execute on function write_schedule(uuid, timestamptz, int[]) to service_role;
