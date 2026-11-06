update checkin_tracks set questions = questions || '{REMARKS}' where not ('REMARKS' = any(questions));
update checkin_schedule set questions = questions || '{REMARKS}' where questions is not null and not ('REMARKS' = any(questions));
