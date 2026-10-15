alter table language_packs add column test_results_file text;
alter table escalations add column not_serious boolean not null default false;
