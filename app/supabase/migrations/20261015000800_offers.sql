create table follow_up_offers (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations on delete cascade,
  response_id uuid not null unique references responses on delete cascade,
  person_id uuid not null references people on delete cascade,
  offered_by text not null,
  queued_at timestamptz not null,
  sent_at timestamptz,
  answer text check (answer in ('yes', 'no_thanks', 'none')),
  closed_at timestamptz,
  contact_due_at timestamptz,
  contact_done_at timestamptz
);

create unique index follow_up_offers_one_open on follow_up_offers (person_id) where closed_at is null;

alter table follow_up_offers enable row level security;

create policy follow_up_offers_hr_read on follow_up_offers for select to authenticated
using (
  organisation_id = (auth.jwt() -> 'app_metadata' ->> 'organisation_id')::uuid
  and auth.jwt() -> 'app_metadata' ->> 'role' in ('hr', 'hr_admin')
);

alter table escalations
  add column dont_contact boolean not null default false,
  add column closed_at timestamptz,
  add column closure_sent_at timestamptz;

create function offers_claim(at timestamptz)
returns table (chat_id bigint, language text)
language plpgsql
set search_path = public
as $$
begin
  update follow_up_offers f
  set answer = 'none', closed_at = org_now(f.organisation_id, at)
  where f.sent_at is not null and f.closed_at is null
    and f.sent_at + interval '7 days' <= org_now(f.organisation_id, at);

  return query
  with due as (
    select f.id
    from follow_up_offers f
    join organisations o on o.id = f.organisation_id
    join people p on p.id = f.person_id
    where f.sent_at is null and f.closed_at is null
      and p.state = 'active' and not p.synthetic and p.telegram_chat_id is not null
      and (o.demo_mode or (
        extract(isodow from at at time zone o.time_zone) <= 5
        and extract(hour from at at time zone o.time_zone) between 9 and 16))
    for update of f skip locked
  )
  update follow_up_offers f
  set sent_at = org_now(f.organisation_id, at)
  from due, people p
  where f.id = due.id and p.id = f.person_id
  returning p.telegram_chat_id, p.language;
end;
$$;

revoke execute on function offers_claim(timestamptz) from public, anon, authenticated;
grant execute on function offers_claim(timestamptz) to service_role;
