alter table escalations
  add column contact_method text check (contact_method in ('call', 'meet')),
  add column contact_phone_encrypted text;
