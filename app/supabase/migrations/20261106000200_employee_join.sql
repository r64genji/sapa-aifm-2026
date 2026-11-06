alter table people add column employee boolean default false;

drop function write_schedule(uuid, timestamptz, int[]);

create function write_schedule(person uuid, at timestamptz, days int[], shift int default 0) returns void
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
    from generate_series((coalesce(p.joined_on, p.start_date) - shift + t.day)::timestamp, (coalesce(p.joined_on, p.start_date) - shift + t.day + 30)::timestamp, interval '1 day') d
    where extract(isodow from d) <= 5 and d::date <> all(o.holidays)
  ) w,
  lateral (select (w.day + time '10:00') at time zone o.time_zone as due_at) slot
  where p.id = person and slot.due_at > org_now(p.organisation_id, at)
  on conflict (person_id, touchpoint) do nothing;
$$;
revoke execute on function write_schedule(uuid, timestamptz, int[], int) from public, anon, authenticated;
grant execute on function write_schedule(uuid, timestamptz, int[], int) to service_role;
