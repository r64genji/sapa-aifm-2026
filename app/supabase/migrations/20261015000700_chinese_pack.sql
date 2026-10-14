alter table people drop constraint people_language_check;
alter table people add constraint people_language_check check (language in ('ms', 'en', 'zh'));
alter table language_packs add column test_passed_on date;
alter table ai_usage drop constraint ai_usage_call_type_check;
alter table ai_usage add constraint ai_usage_call_type_check
  check (call_type in ('classify', 'answer', 'narrative', 'draft', 'translate'));
