alter table checkin_schedule
  add column probes_used int not null default 0,
  add column probe_id text,
  add column probe_at timestamptz;

create table ai_tags (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations on delete cascade,
  response_id uuid not null unique references responses on delete cascade,
  status text not null check (status in ('ok', 'awaiting_ai', 'needs_review', 'reviewed')),
  drivers text[] not null default '{}',
  context_tags text[] not null default '{}',
  positive boolean,
  concern_level text check (concern_level in ('none', 'low', 'needs_follow_up')),
  escalate boolean,
  escalate_category text,
  evidence_quote text,
  summary text,
  confidence text check (confidence in ('low', 'medium', 'high')),
  uncertain boolean,
  probe_id text,
  model text,
  prompt_version text,
  latency_ms int,
  created_at timestamptz not null
);

create table ai_usage (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations on delete cascade,
  provider text not null check (provider in ('gemini', 'deepseek')),
  model text not null,
  call_type text not null check (call_type in ('classify', 'answer', 'narrative', 'draft')),
  input_tokens int not null default 0,
  cached_input_tokens int not null default 0,
  output_tokens int not null default 0,
  cost numeric not null default 0,
  ok boolean not null,
  eval_run_id uuid,
  at timestamptz not null
);

alter table ai_tags enable row level security;
alter table ai_usage enable row level security;
