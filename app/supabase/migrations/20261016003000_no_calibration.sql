update quality_holds set state = 'trusted' where state = 'calibrating';

alter table quality_holds drop constraint quality_holds_state_check;
alter table quality_holds add constraint quality_holds_state_check check (state in ('trusted', 'held'));

create or replace function theme_counts(org uuid, touch int, month date, at timestamptz, team text default null, agency text default null, person_role text default null) returns jsonb
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
      and (month is not null or theme_counts.agency is not null or p.start_date >= o.since)
      and (theme_counts.team is null or p.team = theme_counts.team)
      and (theme_counts.agency is null or p.agency = theme_counts.agency)
      and (theme_counts.person_role is null or p.role = theme_counts.person_role)
      and (month is null or (p.start_date >= month and p.start_date < month + interval '1 month'))
      and not coalesce(t.escalate, false)
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
        ) d)
    ) end
  from o, respondents;
$$;


create or replace function record_spot_check(org uuid, drv text, lang text, was_changed boolean, at timestamptz) returns void
language plpgsql
set search_path = public
as $$
declare
  q quality_holds;
begin
  insert into spot_checks (organisation_id, driver, language, at, changed) values (org, drv, lang, at, was_changed);
  insert into quality_holds (organisation_id, driver, language, state, started_at)
  values (org, drv, lang, 'trusted', at)
  on conflict do nothing;
  update quality_holds
  set spot_checks_done = spot_checks_done + 1, spot_checks_changed = spot_checks_changed + was_changed::int
  where organisation_id = org and driver = drv and language = lang
  returning * into q;
  if q.state <> 'trusted' and q.spot_checks_done >= 20 and q.spot_checks_changed * 10 <= q.spot_checks_done then
    update quality_holds
    set state = 'trusted', spot_checks_done = 0, spot_checks_changed = 0, started_at = at, reason = null
    where organisation_id = org and driver = drv and language = lang;
  elsif q.state = 'trusted' and q.spot_checks_done >= 10 and q.spot_checks_changed * 5 > q.spot_checks_done then
    update quality_holds
    set state = 'held', spot_checks_done = 0, spot_checks_changed = 0, started_at = at,
      reason = format('HR changed %s of %s spot checks, more than 20%%', q.spot_checks_changed, q.spot_checks_done)
    where organisation_id = org and driver = drv and language = lang;
    update ai_tags t set counted = false
    from responses r
    where r.id = t.response_id and t.organisation_id = org and r.language = lang
      and drv = any(t.drivers) and t.status = 'ok' and t.counted;
  end if;
end;
$$;
