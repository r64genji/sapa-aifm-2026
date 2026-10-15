drop function theme_counts(uuid, int, date, timestamptz, text, text);

create function theme_counts(org uuid, touch int, month date, at timestamptz, team text default null, agency text default null, person_role text default null) returns jsonb
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
      and (theme_counts.person_role is null or p.role = theme_counts.person_role)
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

revoke execute on function theme_counts(uuid, int, date, timestamptz, text, text, text) from public, anon, authenticated;
grant execute on function theme_counts(uuid, int, date, timestamptz, text, text, text) to service_role;
