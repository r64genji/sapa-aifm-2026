create table test_clock (
  id boolean primary key default true check (id),
  now timestamptz not null
);
alter table test_clock enable row level security;
notify pgrst, 'reload schema';
