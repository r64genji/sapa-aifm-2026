alter table checkin_schedule add column chat jsonb;

alter table ai_usage drop constraint ai_usage_call_type_check;
alter table ai_usage add constraint ai_usage_call_type_check
  check (call_type in ('classify', 'answer', 'narrative', 'draft', 'translate', 'group', 'chat'));
