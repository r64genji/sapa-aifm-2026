create table action_library (
  id uuid primary key,
  organisation_id uuid not null references organisations on delete cascade,
  driver text not null,
  title text not null,
  text text not null
);

create table actions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations on delete cascade,
  driver text not null,
  library_entry_id uuid references action_library on delete set null,
  draft_reason text not null,
  source text not null check (source in ('theme', 'reply')),
  source_response_id uuid references responses on delete set null,
  title text not null,
  steps text not null,
  scope_type text check (scope_type in ('person', 'team', 'intake')),
  scope_person_id uuid references people on delete set null,
  scope_team text,
  scope_intake date,
  owner_type text check (owner_type in ('manager', 'hr')),
  owner_manager_id uuid references managers on delete set null,
  held boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'assigned', 'accepted', 'done', 'dismissed')),
  created_by text not null,
  created_at timestamptz not null,
  assigned_at timestamptz,
  alert_due_on date,
  alert_sent_at timestamptz,
  due_on date,
  accepted_at timestamptz,
  done_at timestamptz,
  outcome_note text,
  dismissed_at timestamptz,
  dismiss_reason text
);

alter table action_library enable row level security;
alter table actions enable row level security;

alter table managers add column outcome_for uuid references actions on delete set null;

create function action_held(org uuid, drv text, at timestamptz) returns boolean
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
      and (t.status = 'reviewed' or (t.status = 'ok' and t.counted))
      and not exists (
        select 1 from consents c
        where c.person_id = p.id and c.scope = 'share_with_manager' and c.withdrawn_at is null)
  );
$$;

revoke execute on function action_held(uuid, text, timestamptz) from public, anon, authenticated;
grant execute on function action_held(uuid, text, timestamptz) to service_role;

create function alerts_claim(at timestamptz) returns table (id uuid)
language sql
set search_path = public
as $$
  update actions a
  set alert_sent_at = at
  from organisations o
  where o.id = a.organisation_id
    and a.status = 'assigned' and a.owner_type = 'manager' and a.alert_sent_at is null
    and a.alert_due_on <= (at at time zone o.time_zone)::date
  returning a.id;
$$;

revoke execute on function alerts_claim(timestamptz) from public, anon, authenticated;
grant execute on function alerts_claim(timestamptz) to service_role;

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
end;
$$;
