alter table managers
  add column bind_token text unique,
  add column telegram_chat_id bigint unique,
  add column revoked_at timestamptz;

alter table organisations
  add column snapshot_weekday int not null default 1 check (snapshot_weekday between 1 and 7);

create table theme_snapshots (
  organisation_id uuid not null references organisations on delete cascade,
  week date not null,
  touchpoint int not null,
  team text not null,
  respondents int not null,
  suppressed boolean not null,
  counts jsonb,
  primary key (organisation_id, team, touchpoint, week)
);

alter table theme_snapshots enable row level security;

drop function theme_counts(uuid, int, date, timestamptz);

create function theme_counts(org uuid, touch int, month date, at timestamptz, team text default null) returns jsonb
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
        ) d),
      'calibrating', (
        select coalesce(jsonb_agg(distinct q.driver), '[]')
        from quality_holds q where q.organisation_id = org and q.state = 'calibrating')
    ) end
  from o, respondents;
$$;

revoke execute on function theme_counts(uuid, int, date, timestamptz, text) from public, anon, authenticated;
grant execute on function theme_counts(uuid, int, date, timestamptz, text) to service_role;

create function take_snapshots(at timestamptz) returns int
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
    for t in select distinct p.team from people p where p.organisation_id = o.id loop
      c := theme_counts(o.id, 14, null, at, t.team);
      insert into theme_snapshots (organisation_id, week, touchpoint, team, respondents, suppressed, counts)
      values (o.id, o.today, 14, t.team, (c->>'respondents')::int, not (c->>'enough')::boolean, c->'drivers')
      on conflict do nothing;
      get diagnostics added = row_count;
      total := total + added;
    end loop;
  end loop;
  return total;
end;
$$;

revoke execute on function take_snapshots(timestamptz) from public, anon, authenticated;
grant execute on function take_snapshots(timestamptz) to service_role;

create view manager_snapshots as
select
  s.team,
  s.week,
  s.respondents,
  s.suppressed,
  case when s.suppressed then null else (
    select coalesce(jsonb_object_agg(d.key,
      case when (d.value ->> 'n')::int < 3 then to_jsonb('fewer than 3'::text) else d.value -> 'n' end), '{}')
    from jsonb_each(s.counts) d
  ) end as drivers
from theme_snapshots s
where (auth.jwt() -> 'app_metadata' ->> 'role') = 'manager'
  and s.organisation_id = (auth.jwt() -> 'app_metadata' ->> 'organisation_id')::uuid
  and exists (
    select 1 from managers m
    where m.id = (auth.jwt() -> 'app_metadata' ->> 'manager_id')::uuid
      and m.organisation_id = s.organisation_id
      and m.revoked_at is null)
  and s.team in (
    select p.team from people p where p.manager_id = (auth.jwt() -> 'app_metadata' ->> 'manager_id')::uuid)
  and s.week = (
    select max(l.week) from theme_snapshots l
    where l.organisation_id = s.organisation_id and l.team = s.team and l.touchpoint = s.touchpoint);

revoke all on manager_snapshots from public, anon, authenticated;
grant select on manager_snapshots to authenticated;

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
  insert into responses select * from jsonb_populate_recordset(null::responses, seed->'responses');
  insert into ai_tags select * from jsonb_populate_recordset(null::ai_tags, seed->'ai_tags');
  insert into quality_holds select * from jsonb_populate_recordset(null::quality_holds, seed->'quality_holds');
  insert into handbook_pages select * from jsonb_populate_recordset(null::handbook_pages, seed->'handbook_pages');
  insert into question_groups select * from jsonb_populate_recordset(null::question_groups, seed->'question_groups');
  insert into asked_questions select * from jsonb_populate_recordset(null::asked_questions, seed->'asked_questions');
  insert into theme_snapshots select * from jsonb_populate_recordset(null::theme_snapshots, seed->'theme_snapshots');
end;
$$;
