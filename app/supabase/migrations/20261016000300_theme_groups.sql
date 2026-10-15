alter table ai_usage drop constraint ai_usage_call_type_check;
alter table ai_usage add constraint ai_usage_call_type_check
  check (call_type in ('classify', 'answer', 'narrative', 'draft', 'translate', 'group'));

create table theme_groups (
  organisation_id uuid not null references organisations on delete cascade,
  driver text not null,
  touchpoint int not null,
  day date not null,
  result jsonb not null,
  primary key (organisation_id, driver, touchpoint, day)
);

alter table theme_groups enable row level security;

create function theme_reply_summaries(org uuid, touch int, driver text, at timestamptz) returns table (response_id uuid, summary text)
language sql stable
set search_path = public
as $$
  select t.response_id, t.summary
  from ai_tags t
  join responses r on r.id = t.response_id
  join checkin_schedule s on s.id = r.schedule_id
  join people p on p.id = s.person_id
  join organisations o on o.id = org
  where t.organisation_id = org
    and s.touchpoint = touch
    and p.start_date >= (at at time zone o.time_zone)::date - interval '6 months'
    and driver = any (t.drivers)
    and t.summary is not null
    and not coalesce(t.escalate, false)
    and not exists (select 1 from escalations e where e.response_id = t.response_id)
    and (t.status = 'reviewed' or (t.status = 'ok' and t.counted))
  order by r.created_at, t.response_id;
$$;

create function reply_people(ids uuid[]) returns int
language sql stable
set search_path = public
as $$
  select count(distinct person_id)::int from responses where id = any (ids);
$$;

revoke execute on function theme_reply_summaries(uuid, int, text, timestamptz) from public, anon, authenticated;
revoke execute on function reply_people(uuid[]) from public, anon, authenticated;
grant execute on function theme_reply_summaries(uuid, int, text, timestamptz) to service_role;
grant execute on function reply_people(uuid[]) to service_role;
