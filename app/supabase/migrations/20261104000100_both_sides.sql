alter table checkin_schedule add column share_with_lead text check (share_with_lead in ('meet', 'tell', 'no')), add column round_closed_at timestamptz;

create table lead_briefs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations on delete cascade,
  manager_id uuid not null references managers on delete cascade,
  items jsonb not null,
  sent_at timestamptz not null,
  side_encrypted text,
  side_at timestamptz
);
alter table lead_briefs enable row level security;

alter table actions add column plan jsonb;

alter table ai_usage drop constraint ai_usage_call_type_check;
alter table ai_usage add constraint ai_usage_call_type_check
  check (call_type in ('classify', 'answer', 'narrative', 'draft', 'translate', 'group', 'chat', 'say', 'brief', 'plan'));
