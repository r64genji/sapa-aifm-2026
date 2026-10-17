alter table intakes drop column join_token;
alter table people drop constraint people_state_check;
alter table people add constraint people_state_check
  check (state in ('invited', 'consent_shown', 'declined', 'active', 'stopped', 'left', 'deleted'));
