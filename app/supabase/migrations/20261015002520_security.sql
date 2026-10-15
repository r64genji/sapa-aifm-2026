create or replace function theme_counts(org uuid, touch int, month date, at timestamptz, team text default null, agency text default null) returns jsonb
language sql stable
set search_path = public
as $$
  with o as (
    select min_group_size as minimum, (at at time zone time_zone)::date - interval '6 months' as since
    from organisations where id = org
  ),
  counted as (
    select s.person_id, t.drivers, t.context_tags, t.status = 'reviewed' as reviewed
    from ai_tags t
    join responses r on r.id = t.response_id
    join checkin_schedule s on s.id = r.schedule_id
    join people p on p.id = s.person_id, o
    where t.organisation_id = org
      and s.touchpoint = touch
      and p.start_date >= o.since
      and (theme_counts.team is null or p.team = theme_counts.team)
      and (theme_counts.agency is null or p.agency = theme_counts.agency)
      and (month is null or (p.start_date >= month and p.start_date < month + interval '1 month'))
      and not coalesce(t.escalate, false)
      and not exists (select 1 from escalations e where e.response_id = t.response_id)
      and (t.status = 'reviewed' or (t.status = 'ok' and t.counted))
  ),
  respondents as (select count(distinct person_id)::int as n from counted)
  select jsonb_build_object('respondents', respondents.n, 'min_group_size', o.minimum, 'enough', respondents.n >= o.minimum)
    || case when respondents.n < o.minimum then '{}'::jsonb else jsonb_build_object(
      'drivers', (
        select coalesce(jsonb_object_agg(d.label, jsonb_build_object(
          'n', d.n, 'reviewed', d.reviewed, 'ai_confident', d.n - d.reviewed)), '{}')
        from (
          select x.label, count(*) as n, count(*) filter (where x.reviewed) as reviewed
          from (
            select c.person_id, label, bool_or(c.reviewed) as reviewed
            from counted c, unnest(c.drivers) as label group by 1, 2
          ) x group by x.label
        ) d),
      'context', (
        select coalesce(jsonb_object_agg(d.label, d.n), '{}')
        from (
          select label, count(distinct c.person_id) as n
          from counted c, unnest(c.context_tags) as label group by label
        ) d),
      'calibrating', (
        select coalesce(jsonb_agg(distinct q.driver), '[]')
        from quality_holds q where q.organisation_id = org and q.state = 'calibrating')
    ) end
  from o, respondents;
$$;

create or replace function queue_spot_checks(at timestamptz) returns int
language plpgsql
set search_path = public
as $$
declare
  total int := 0;
  added int;
  o record;
begin
  for o in select id, (at at time zone time_zone)::date as today, snapshot_weekday from organisations loop
    continue when extract(isodow from o.today) <> o.snapshot_weekday;
    continue when exists (
      select 1 from ai_tags t where t.organisation_id = o.id and t.spot_check_at > at - interval '6 days');
    with pool as (
      select t.response_id, row_number() over (partition by d.driver, r.language order by random()) as rn
      from ai_tags t
      join responses r on r.id = t.response_id
      cross join lateral unnest(t.drivers) as d(driver)
      where t.organisation_id = o.id and t.status = 'ok' and not coalesce(t.escalate, false)
        and not exists (select 1 from escalations e where e.response_id = t.response_id)
        and t.spot_check_at is null
    )
    update ai_tags t set spot_check_at = at
    where t.response_id in (select response_id from pool where rn <= 3);
    get diagnostics added = row_count;
    total := total + added;
  end loop;
  return total;
end;
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
      and s.touchpoint = 14
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
