create table intakes (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations on delete cascade,
  label text not null,
  start_date date not null,
  join_token text not null unique,
  expires_at timestamptz not null,
  teams jsonb not null
);

alter table intakes enable row level security;

alter table people
  add column intake_id uuid references intakes on delete cascade,
  alter column invite_token drop not null,
  alter column invite_expires_at drop not null,
  alter column team drop not null,
  alter column manager_id drop not null,
  alter column role drop not null;

alter table people drop constraint people_state_check;
alter table people add constraint people_state_check
  check (state in ('invited', 'consent_shown', 'choosing_team', 'declined', 'active', 'stopped', 'left', 'deleted'));

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
  insert into action_library select * from jsonb_populate_recordset(null::action_library, seed->'action_library');
  insert into actions select * from jsonb_populate_recordset(null::actions, seed->'actions');
  insert into intake_outcomes select * from jsonb_populate_recordset(null::intake_outcomes, seed->'intake_outcomes');
  insert into milestone_nudges select * from jsonb_populate_recordset(null::milestone_nudges, seed->'milestone_nudges');
end;
$$;
