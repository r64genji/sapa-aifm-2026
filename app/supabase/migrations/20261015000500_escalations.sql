alter table organisations
  add column escalation_contacts jsonb not null default '{"general": [], "forced_labour_indicator": []}';

create table escalations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations on delete cascade,
  response_id uuid not null unique references responses on delete cascade,
  source text not null check (source in ('keyword', 'model', 'both')),
  category text not null,
  created_at timestamptz not null,
  acknowledged_at timestamptz,
  contact_recorded_at timestamptz
);

alter table escalations enable row level security;

create policy escalations_hr_read on escalations for select to authenticated
using (
  organisation_id = (auth.jwt() -> 'app_metadata' ->> 'organisation_id')::uuid
  and auth.jwt() -> 'app_metadata' ->> 'role' in ('hr', 'hr_admin')
);

create view theme_tags with (security_invoker = true) as
select t.organisation_id, t.response_id, r.person_id, s.touchpoint, t.drivers, t.status
from ai_tags t
join responses r on r.id = t.response_id
left join checkin_schedule s on s.id = r.schedule_id
where t.status in ('ok', 'reviewed')
  and not exists (select 1 from escalations e where e.response_id = t.response_id);
