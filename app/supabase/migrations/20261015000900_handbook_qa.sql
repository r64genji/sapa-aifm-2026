create table handbook_pages (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations on delete cascade,
  path text not null,
  language text not null check (language in ('ms', 'en', 'zh')),
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  updated_by text not null,
  updated_at timestamptz not null,
  unique (organisation_id, path, language)
);

create table question_groups (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations on delete cascade,
  text text not null,
  created_at timestamptz not null,
  forwarded_at timestamptz,
  handbook_path text
);

create table asked_questions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations on delete cascade,
  person_id uuid not null references people on delete cascade,
  group_id uuid references question_groups on delete cascade,
  important_topic text,
  text_encrypted text,
  answer_encrypted text,
  language text not null,
  outcome text not null check (outcome in ('answered', 'unknown', 'important')),
  cited_path text,
  created_at timestamptz not null
);

alter table handbook_pages enable row level security;
alter table question_groups enable row level security;
alter table asked_questions enable row level security;

create policy hr_reads_question_groups on question_groups for select to authenticated
  using (
    organisation_id = (auth.jwt() -> 'app_metadata' ->> 'organisation_id')::uuid
    and (auth.jwt() -> 'app_metadata' ->> 'role') in ('hr', 'hr_admin')
  );

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
end;
$$;
