alter table people add column anonymous boolean default false;
alter table responses add column anonymous boolean not null default false;

create or replace function responses_take_anonymous() returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.anonymous := coalesce((select anonymous from people where id = new.person_id), false);
  return new;
end;
$$;

create trigger responses_take_anonymous before insert on responses
for each row execute function responses_take_anonymous();
