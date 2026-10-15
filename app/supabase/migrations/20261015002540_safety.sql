create function mark_escalated_tag() returns trigger
language plpgsql
set search_path = public
as $$
begin
  update ai_tags set escalate = true where response_id = new.response_id;
  return new;
end;
$$;

create trigger escalations_mark_tag after insert on escalations
for each row execute function mark_escalated_tag();

create function keep_escalated_tag() returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (select 1 from escalations e where e.response_id = new.response_id) then
    new.escalate := true;
  end if;
  return new;
end;
$$;

create trigger ai_tags_keep_escalated before insert or update on ai_tags
for each row execute function keep_escalated_tag();

update ai_tags t set escalate = true
where exists (select 1 from escalations e where e.response_id = t.response_id);

alter table ai_usage drop constraint ai_usage_organisation_id_fkey;
