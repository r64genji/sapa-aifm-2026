delete from theme_groups;
alter table theme_groups drop constraint theme_groups_pkey;
alter table theme_groups drop column day;
alter table theme_groups add column replies_hash text not null;
alter table theme_groups add primary key (organisation_id, driver, touchpoint, replies_hash);
