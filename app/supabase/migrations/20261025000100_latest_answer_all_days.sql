create function latest_checkin(person uuid) returns uuid
language sql stable
set search_path = public
as $$
  select r.schedule_id
  from ai_tags t
  join responses r on r.id = t.response_id
  join checkin_schedule s on s.id = r.schedule_id
  where r.person_id = person
    and not coalesce(t.escalate, false)
    and (t.status = 'reviewed' or (t.status = 'ok' and t.counted))
  order by r.created_at desc, s.touchpoint desc, r.id desc
  limit 1;
$$;

revoke execute on function latest_checkin(uuid) from public, anon, authenticated;
grant execute on function latest_checkin(uuid) to service_role;

create or replace function theme_counts(org uuid, touch int, month date, at timestamptz, team text default null, agency text default null, person_role text default null, teams text[] default null, first_job boolean default null) returns jsonb
language sql stable
set search_path = public
as $$
  with o as (
    select min_group_size as minimum, (at at time zone time_zone)::date - interval '6 months' as since
    from organisations where id = org
  ),
  scope as (
    select s.id, s.person_id
    from checkin_schedule s
    join people p on p.id = s.person_id, o
    where p.organisation_id = org
      and (touch = 0 or s.touchpoint = touch)
      and (month is not null or theme_counts.agency is not null or p.start_date >= o.since)
      and (theme_counts.team is null or p.team = theme_counts.team)
      and (theme_counts.teams is null or p.team = any(theme_counts.teams))
      and (theme_counts.agency is null or p.agency = theme_counts.agency)
      and (theme_counts.person_role is null or p.role = theme_counts.person_role)
      and (theme_counts.first_job is null or p.first_job = theme_counts.first_job)
      and (month is null or (p.start_date >= month and p.start_date < month + interval '1 month'))
  ),
  counted as (
    select sc.id as schedule_id, sc.person_id, t.drivers, t.context_tags, t.status = 'reviewed' as reviewed
    from ai_tags t
    join responses r on r.id = t.response_id
    join scope sc on sc.id = r.schedule_id
    where t.organisation_id = org
      and not coalesce(t.escalate, false)
      and (t.status = 'reviewed' or (t.status = 'ok' and t.counted))
      and (touch <> 0 or sc.id = latest_checkin(sc.person_id))
  ),
  scored as (
    select sc.person_id, r.question_id as label, r.scale_value
    from responses r
    join scope sc on sc.id = r.schedule_id
    where r.scale_value is not null
      and sc.id in (select schedule_id from counted)
      and r.question_id in ('ROLE_CLARITY', 'MANAGER_SUPPORT', 'BELONGING', 'ONBOARDING', 'TRAINING', 'WORKLOAD')
      and not exists (
        select 1 from responses e
        left join escalations x on x.response_id = e.id
        left join ai_tags y on y.response_id = e.id
        where e.schedule_id = sc.id and (x.id is not null or coalesce(y.escalate, false)))
  ),
  respondents as (select count(distinct person_id)::int as n from counted)
  select jsonb_build_object('respondents', respondents.n, 'min_group_size', o.minimum, 'enough', respondents.n >= o.minimum)
    || case when respondents.n < o.minimum then '{}'::jsonb else jsonb_build_object(
      'drivers', (
        select coalesce(jsonb_object_agg(d.label, jsonb_build_object(
          'n', d.n, 'reviewed', d.reviewed, 'ai_confident', d.typed - d.reviewed, 'score_only', d.n - d.typed, 'avg', a.avg)), '{}')
        from (
          select x.label, count(*) as n, count(*) filter (where x.typed) as typed, count(*) filter (where x.reviewed) as reviewed
          from (
            select u.person_id, u.label, bool_or(u.typed) as typed, bool_or(u.reviewed) as reviewed
            from (
              select c.person_id, label, true as typed, c.reviewed
              from counted c, unnest(c.drivers) as label
              union all
              select s.person_id, s.label, false, false
              from scored s where s.scale_value <= 2
            ) u group by 1, 2
          ) x group by x.label
        ) d
        left join (select label, round(avg(scale_value), 1) as avg from scored group by label) a on a.label = d.label),
      'context', (
        select coalesce(jsonb_object_agg(d.label, d.n), '{}')
        from (
          select label, count(distinct c.person_id) as n
          from counted c, unnest(c.context_tags) as label group by label
        ) d)
    ) end
  from o, respondents;
$$;

create or replace function theme_reply_summaries(org uuid, touch int, driver text, at timestamptz) returns table (response_id uuid, summary text)
language sql stable
set search_path = public
as $$
  select t.response_id, t.summary
  from ai_tags t
  join responses r on r.id = t.response_id
  join checkin_schedule s on s.id = r.schedule_id
  join people p on p.id = s.person_id
  join organisations o on o.id = org
  where t.organisation_id = org
    and (touch = 0 or s.touchpoint = touch)
    and (touch <> 0 or s.id = latest_checkin(p.id))
    and p.start_date >= (at at time zone o.time_zone)::date - interval '6 months'
    and driver = any (t.drivers)
    and t.summary is not null
    and not coalesce(t.escalate, false)
    and (t.status = 'reviewed' or (t.status = 'ok' and t.counted))
  order by r.created_at, t.response_id;
$$;

create or replace function action_held(org uuid, drv text, at timestamptz) returns boolean
language sql stable
set search_path = public
as $$
  select exists (
    select 1
    from ai_tags t
    join responses r on r.id = t.response_id
    join checkin_schedule s on s.id = r.schedule_id
    join people p on p.id = s.person_id
    join organisations o on o.id = org
    where t.organisation_id = org
      and s.id = latest_checkin(p.id)
      and p.start_date >= (at at time zone o.time_zone)::date - interval '6 months'
      and drv = any(t.drivers)
      and not coalesce(t.escalate, false)
      and not exists (select 1 from escalations e where e.response_id = t.response_id)
      and (t.status = 'reviewed' or (t.status = 'ok' and t.counted))
      and not exists (
        select 1 from consents c
        where c.person_id = p.id and c.scope = 'share_with_manager' and c.withdrawn_at is null)
  );
$$;

create or replace function take_snapshots(at timestamptz) returns int
language plpgsql
set search_path = public
as $$
declare
  total int := 0;
  added int;
  o record;
  t record;
  c jsonb;
begin
  for o in select id, (at at time zone time_zone)::date as today, snapshot_weekday from organisations loop
    continue when extract(isodow from o.today) <> o.snapshot_weekday;
    for t in select distinct p.team from people p where p.organisation_id = o.id and p.team is not null loop
      c := theme_counts(o.id, 0, null, at, t.team);
      insert into theme_snapshots (organisation_id, week, touchpoint, team, respondents, suppressed, counts)
      values (o.id, o.today, 0, t.team, (c->>'respondents')::int, not (c->>'enough')::boolean, c->'drivers')
      on conflict do nothing;
      get diagnostics added = row_count;
      total := total + added;
    end loop;
    for t in
      select w.tower, array_agg(s.team order by s.team) as small
      from theme_snapshots s
      join team_towers w on w.organisation_id = s.organisation_id and w.team = s.team
      where s.organisation_id = o.id and s.week = o.today and s.touchpoint = 0 and s.suppressed
      group by w.tower
      having count(*) >= 2
    loop
      c := theme_counts(o.id, 0, null, at, teams => t.small);
      insert into tower_snapshots (organisation_id, week, touchpoint, tower, teams, respondents, suppressed, counts)
      values (o.id, o.today, 0, t.tower, t.small, (c->>'respondents')::int, not (c->>'enough')::boolean, c->'drivers')
      on conflict do nothing;
    end loop;
  end loop;
  return total;
end;
$$;

update theme_snapshots set touchpoint = 0 where touchpoint = 14;
update tower_snapshots set touchpoint = 0 where touchpoint = 14;
delete from theme_groups;
