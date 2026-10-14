create table organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  time_zone text not null default 'Asia/Kuala_Lumpur',
  hr_language text not null default 'en' check (hr_language in ('ms', 'en')),
  min_group_size int not null default 5 check (min_group_size >= 5),
  retention_days int not null default 182,
  demo_offset_days int not null default 0,
  demo_mode boolean not null default false
);

create table inbound_updates (
  platform text not null,
  update_id bigint not null,
  received_at timestamptz not null,
  primary key (platform, update_id)
);

alter table organisations enable row level security;
alter table inbound_updates enable row level security;

create function reset_demo(seed jsonb) returns void
language plpgsql
set search_path = public
as $$
begin
  truncate organisations, inbound_updates cascade;
  insert into organisations select * from jsonb_populate_recordset(null::organisations, seed->'organisations');
end;
$$;

revoke execute on function reset_demo(jsonb) from public, anon, authenticated;
grant execute on function reset_demo(jsonb) to service_role;
