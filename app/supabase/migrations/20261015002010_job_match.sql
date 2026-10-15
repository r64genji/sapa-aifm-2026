alter table action_library add column type text not null default 'normal' check (type in ('normal', 'hiring_side'));

alter table actions drop constraint actions_source_check;
alter table actions add constraint actions_source_check check (source in ('theme', 'reply', 'job_match'));
alter table actions add column hiring_side boolean not null default false;

create function job_match(org uuid, at timestamptz) returns table (role text, respondents int, not_really int)
language sql stable
set search_path = public
as $$
  with o as (
    select (at at time zone time_zone)::date - interval '6 months' as since
    from organisations where id = org
  )
  select p.role, count(a.id)::int, (count(a.id) filter (where a.scale_value <= 2))::int
  from people p
  cross join o
  left join lateral (
    select r.id, r.scale_value
    from responses r
    join checkin_schedule s on s.id = r.schedule_id
    where r.person_id = p.id and r.question_id = 'JOB_MATCH' and s.touchpoint = 14
    order by r.created_at desc
    limit 1
  ) a on true
  where p.organisation_id = org and p.start_date >= o.since
  group by p.role
  order by p.role;
$$;

revoke execute on function job_match(uuid, timestamptz) from public, anon, authenticated;
grant execute on function job_match(uuid, timestamptz) to service_role;
