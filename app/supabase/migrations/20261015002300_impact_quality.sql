alter table organisations
  add column retention_baseline_kept int,
  add column retention_baseline_of int,
  add column hold_new_tags boolean not null default false;

create table intake_outcomes (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations on delete cascade,
  intake text not null check (intake ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  agency text,
  hired int not null check (hired >= 0),
  employed int not null check (employed between 0 and hired),
  entered_by text not null,
  entered_at timestamptz not null
);

create unique index intake_outcomes_key on intake_outcomes (organisation_id, intake, coalesce(agency, ''));

alter table intake_outcomes enable row level security;

alter table ai_tags add column spot_check_at timestamptz;

create table spot_checks (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations on delete cascade,
  driver text not null,
  language text not null,
  at timestamptz not null,
  changed boolean not null
);

alter table spot_checks enable row level security;

create function queue_spot_checks(at timestamptz) returns int
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

create function record_spot_check(org uuid, drv text, lang text, was_changed boolean, at timestamptz) returns void
language plpgsql
set search_path = public
as $$
declare
  q quality_holds;
begin
  insert into spot_checks (organisation_id, driver, language, at, changed) values (org, drv, lang, at, was_changed);
  insert into quality_holds (organisation_id, driver, language, state, started_at)
  values (org, drv, lang, 'calibrating', at)
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

revoke execute on function queue_spot_checks(timestamptz) from public, anon, authenticated;
revoke execute on function record_spot_check(uuid, text, text, boolean, timestamptz) from public, anon, authenticated;
grant execute on function queue_spot_checks(timestamptz) to service_role;
grant execute on function record_spot_check(uuid, text, text, boolean, timestamptz) to service_role;

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
  insert into action_library select * from jsonb_populate_recordset(null::action_library, seed->'action_library');
  insert into actions select * from jsonb_populate_recordset(null::actions, seed->'actions');
  insert into intake_outcomes select * from jsonb_populate_recordset(null::intake_outcomes, seed->'intake_outcomes');
end;
$$;
