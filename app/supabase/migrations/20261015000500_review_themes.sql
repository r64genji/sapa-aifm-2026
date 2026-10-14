alter table ai_tags
  add column counted boolean not null default false,
  add column reviewed_by text,
  add column reviewed_at timestamptz;

create table quality_holds (
  organisation_id uuid not null references organisations on delete cascade,
  driver text not null,
  language text not null,
  state text not null check (state in ('calibrating', 'trusted', 'held')),
  spot_checks_done int not null default 0,
  spot_checks_changed int not null default 0,
  started_at timestamptz not null,
  reason text,
  primary key (organisation_id, driver, language)
);

create table change_signals (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations on delete cascade,
  scope text not null check (scope in ('cohort', 'queue', 'action')),
  at timestamptz not null
);

alter table quality_holds enable row level security;
alter table change_signals enable row level security;

create policy hr_reads_change_signals on change_signals for select to authenticated
  using (
    organisation_id = (auth.jwt() -> 'app_metadata' ->> 'organisation_id')::uuid
    and (auth.jwt() -> 'app_metadata' ->> 'role') in ('hr', 'hr_admin')
  );

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table change_signals;
  end if;
end;
$$;

create function theme_counts(org uuid, touch int, month date, at timestamptz) returns jsonb
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

revoke execute on function theme_counts(uuid, int, date, timestamptz) from public, anon, authenticated;
grant execute on function theme_counts(uuid, int, date, timestamptz) to service_role;

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
end;
$$;
