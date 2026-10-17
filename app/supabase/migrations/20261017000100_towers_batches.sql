create table team_towers (
  organisation_id uuid not null references organisations on delete cascade,
  team text not null,
  tower text not null,
  primary key (organisation_id, team)
);

create table tower_snapshots (
  organisation_id uuid not null references organisations on delete cascade,
  week date not null,
  touchpoint int not null,
  tower text not null,
  teams text[] not null,
  respondents int not null,
  suppressed boolean not null,
  counts jsonb,
  primary key (organisation_id, tower, touchpoint, week)
);

alter table team_towers enable row level security;
alter table tower_snapshots enable row level security;

alter table actions add column batch_id uuid;

drop function theme_counts(uuid, int, date, timestamptz, text, text, text);

create function theme_counts(org uuid, touch int, month date, at timestamptz, team text default null, agency text default null, person_role text default null, teams text[] default null) returns jsonb
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
      and s.touchpoint = touch
      and (month is not null or theme_counts.agency is not null or p.start_date >= o.since)
      and (theme_counts.team is null or p.team = theme_counts.team)
      and (theme_counts.teams is null or p.team = any(theme_counts.teams))
      and (theme_counts.agency is null or p.agency = theme_counts.agency)
      and (theme_counts.person_role is null or p.role = theme_counts.person_role)
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
  ),
  scored as (
    select sc.person_id, r.question_id as label, r.scale_value
    from responses r
    join scope sc on sc.id = r.schedule_id
    where r.scale_value is not null
      and sc.id in (select schedule_id from counted)
      and r.question_id in ('ROLE_CLARITY', 'MANAGER_SUPPORT', 'BELONGING', 'ONBOARDING_TRAINING', 'WORKLOAD')
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
          'n', d.n, 'reviewed', d.reviewed, 'ai_confident', d.typed - d.reviewed, 'score_only', d.n - d.typed)), '{}')
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

revoke execute on function theme_counts(uuid, int, date, timestamptz, text, text, text, text[]) from public, anon, authenticated;
grant execute on function theme_counts(uuid, int, date, timestamptz, text, text, text, text[]) to service_role;

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
      c := theme_counts(o.id, 14, null, at, t.team);
      insert into theme_snapshots (organisation_id, week, touchpoint, team, respondents, suppressed, counts)
      values (o.id, o.today, 14, t.team, (c->>'respondents')::int, not (c->>'enough')::boolean, c->'drivers')
      on conflict do nothing;
      get diagnostics added = row_count;
      total := total + added;
    end loop;
    for t in
      select w.tower, array_agg(s.team order by s.team) as small
      from theme_snapshots s
      join team_towers w on w.organisation_id = s.organisation_id and w.team = s.team
      where s.organisation_id = o.id and s.week = o.today and s.touchpoint = 14 and s.suppressed
      group by w.tower
      having count(*) >= 2
    loop
      c := theme_counts(o.id, 14, null, at, teams => t.small);
      insert into tower_snapshots (organisation_id, week, touchpoint, tower, teams, respondents, suppressed, counts)
      values (o.id, o.today, 14, t.tower, t.small, (c->>'respondents')::int, not (c->>'enough')::boolean, c->'drivers')
      on conflict do nothing;
    end loop;
  end loop;
  return total;
end;
$$;

create or replace function reset_demo(seed jsonb) returns void
language plpgsql
set search_path = public
as $$
begin
  truncate organisations, inbound_updates, audit_log cascade;
  insert into organisations select * from jsonb_populate_recordset(null::organisations, seed->'organisations');
  insert into language_packs select * from jsonb_populate_recordset(null::language_packs, seed->'language_packs');
  insert into managers select * from jsonb_populate_recordset(null::managers, seed->'managers');
  insert into intakes select * from jsonb_populate_recordset(null::intakes, seed->'intakes');
  insert into people select * from jsonb_populate_recordset(null::people, seed->'people');
  insert into consents select * from jsonb_populate_recordset(null::consents, seed->'consents');
  insert into checkin_schedule select * from jsonb_populate_recordset(null::checkin_schedule, seed->'checkin_schedule');
  insert into responses select * from jsonb_populate_recordset(null::responses, seed->'responses');
  insert into ai_tags select * from jsonb_populate_recordset(null::ai_tags, seed->'ai_tags');
  insert into escalations select * from jsonb_populate_recordset(null::escalations, seed->'escalations');
  insert into quality_holds select * from jsonb_populate_recordset(null::quality_holds, seed->'quality_holds');
  insert into handbook_pages select * from jsonb_populate_recordset(null::handbook_pages, seed->'handbook_pages');
  insert into question_groups select * from jsonb_populate_recordset(null::question_groups, seed->'question_groups');
  insert into asked_questions select * from jsonb_populate_recordset(null::asked_questions, seed->'asked_questions');
  insert into theme_snapshots select * from jsonb_populate_recordset(null::theme_snapshots, seed->'theme_snapshots');
  insert into team_towers select * from jsonb_populate_recordset(null::team_towers, seed->'team_towers');
  insert into tower_snapshots select * from jsonb_populate_recordset(null::tower_snapshots, seed->'tower_snapshots');
  insert into action_library select * from jsonb_populate_recordset(null::action_library, seed->'action_library');
  insert into actions select * from jsonb_populate_recordset(null::actions, seed->'actions');
  insert into intake_outcomes select * from jsonb_populate_recordset(null::intake_outcomes, seed->'intake_outcomes');
  insert into milestone_nudges select * from jsonb_populate_recordset(null::milestone_nudges, seed->'milestone_nudges');
end;
$$;
