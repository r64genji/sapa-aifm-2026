alter table actions
  add column draft_notes jsonb,
  add column notes jsonb,
  add column note_approved_by text,
  add column note_approved_at timestamptz,
  add column no_notice_reason text,
  add column score_change jsonb;

alter table responses add column action_id uuid references actions on delete set null;

alter table checkin_schedule
  add column recheck_action_id uuid references actions on delete set null,
  add column recheck_driver text;

create table notices (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations on delete cascade,
  action_id uuid not null references actions on delete cascade,
  person_id uuid not null references people on delete cascade,
  language text not null,
  queued_at timestamptz not null,
  sent_at timestamptz,
  unique (action_id, person_id)
);

alter table notices enable row level security;

create function recheck_queue(action uuid, drv text, people_ids uuid[]) returns void
language sql
set search_path = public
as $$
  update checkin_schedule s
  set recheck_action_id = action, recheck_driver = drv
  where s.id in (
    select distinct on (c.person_id) c.id
    from checkin_schedule c
    where c.person_id = any(people_ids) and c.status = 'scheduled' and c.recheck_action_id is null
    order by c.person_id, c.due_at
  );
$$;

create function notices_claim(at timestamptz)
returns table (chat_id bigint, language text, note text)
language plpgsql
set search_path = public
as $$
begin
  delete from notices n using people p
  where p.id = n.person_id and n.sent_at is null
    and (p.state <> 'active'
      or not exists (select 1 from consents c where c.person_id = p.id and c.withdrawn_at is null));

  return query
  with due as (
    select n.id
    from notices n
    join organisations o on o.id = n.organisation_id
    join people p on p.id = n.person_id
    where n.sent_at is null
      and p.state = 'active' and not p.synthetic and p.telegram_chat_id is not null
      and (o.demo_mode or (
        extract(isodow from at at time zone o.time_zone) <= 5
        and extract(hour from at at time zone o.time_zone) between 9 and 16))
    for update of n skip locked
  )
  update notices n
  set sent_at = org_now(n.organisation_id, at)
  from due, people p, actions a
  where n.id = due.id and p.id = n.person_id and a.id = n.action_id
  returning p.telegram_chat_id, p.language, coalesce(a.notes ->> p.language, a.notes ->> 'en');
end;
$$;

revoke execute on function recheck_queue(uuid, text, uuid[]) from public, anon, authenticated;
revoke execute on function notices_claim(timestamptz) from public, anon, authenticated;
grant execute on function recheck_queue(uuid, text, uuid[]) to service_role;
grant execute on function notices_claim(timestamptz) to service_role;

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
end;
$$;
