alter table action_library add column created_by text;
alter table action_library add column deleted_at timestamptz;
alter table actions add column own_fix boolean not null default false;
