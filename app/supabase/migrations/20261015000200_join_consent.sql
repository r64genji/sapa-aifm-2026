create table language_packs (
  organisation_id uuid not null references organisations on delete cascade,
  language text not null check (language in ('ms', 'en', 'zh')),
  checker_name text,
  checked_on date,
  primary key (organisation_id, language),
  check ((checker_name is null) = (checked_on is null))
);

create table managers (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations on delete cascade,
  display_name text not null,
  unique (organisation_id, id)
);

create table people (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations on delete cascade,
  code_name text not null,
  team text not null,
  manager_id uuid not null,
  start_date date not null,
  role text not null,
  language text not null check (language in ('ms', 'en')),
  telegram_chat_id bigint unique,
  invite_token text not null unique,
  invite_expires_at timestamptz not null,
  invite_used_at timestamptz,
  state text not null default 'invited'
    check (state in ('invited', 'consent_shown', 'declined', 'active', 'stopped')),
  stopped_at timestamptz,
  foreign key (organisation_id, manager_id) references managers (organisation_id, id)
);

create table consents (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations on delete cascade,
  person_id uuid not null references people on delete cascade,
  text_version text not null,
  scope text not null default 'hr_only' check (scope in ('hr_only', 'share_with_manager')),
  granted_at timestamptz not null,
  withdrawn_at timestamptz
);

alter table language_packs enable row level security;
alter table managers enable row level security;
alter table people enable row level security;
alter table consents enable row level security;

create or replace function reset_demo(seed jsonb) returns void
language plpgsql
set search_path = public
as $$
begin
  truncate organisations, inbound_updates cascade;
  insert into organisations select * from jsonb_populate_recordset(null::organisations, seed->'organisations');
  insert into language_packs select * from jsonb_populate_recordset(null::language_packs, seed->'language_packs');
  insert into managers select * from jsonb_populate_recordset(null::managers, seed->'managers');
  insert into people select * from jsonb_populate_recordset(null::people, seed->'people');
end;
$$;
