create table translations (
  organisation_id uuid not null references organisations on delete cascade,
  target text not null,
  source_hash text not null,
  text text not null,
  primary key (organisation_id, target, source_hash)
);

alter table translations enable row level security;

create index responses_person_id_created_at_idx on responses (person_id, created_at desc);
