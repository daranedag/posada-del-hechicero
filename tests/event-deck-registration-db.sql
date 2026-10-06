DO $test$
DECLARE
  owner uuid;
  event uuid;
  tournament uuid;
  code text;
  stamp timestamptz;
  count_before integer;
  payload jsonb := '{"title":"Registration rehearsal","description":"Temporary fixture","event_type":"magic","location":"Test location","starts_at":"2026-10-09T21:00:00Z","ends_at":"2026-10-09T23:00:00Z","status":"draft","recurrence_days":null,"recurrence_until":null}';
  registration jsonb := '{"format_code":"modern","submission_deadline":"2026-10-09T22:00:00Z"}';
BEGIN
  SELECT user_id INTO owner FROM public.pdh_admins LIMIT 1;
  IF owner IS NULL THEN RAISE EXCEPTION 'An existing admin is required for rehearsal'; END IF;
  event := public.pdh_save_calendar_event_with_registration(NULL,'create',NULL,NULL,payload,owner,registration);
  SELECT tournament_id, updated_at INTO tournament, stamp FROM public.pdh_events WHERE id = event;
  SELECT t.code INTO code FROM public.pdh_tournaments t WHERE id = tournament AND status = 'draft';
  IF code IS NULL OR NOT EXISTS (SELECT 1 FROM public.pdh_events WHERE id = event AND registration_url = '/torneos/' || code) THEN
    RAISE EXCEPTION 'Tournament link or draft status missing';
  END IF;
  PERFORM public.pdh_save_calendar_event_with_registration(event,'update',NULL,stamp,payload || '{"status":"published","title":"Updated rehearsal"}',owner,NULL);
  IF NOT EXISTS (SELECT 1 FROM public.pdh_tournaments WHERE id = tournament AND status = 'open' AND name = 'Updated rehearsal' AND submission_deadline = '2026-10-09T22:00:00Z') THEN
    RAISE EXCEPTION 'Publish sync failed or deadline changed';
  END IF;
  SELECT updated_at INTO stamp FROM public.pdh_events WHERE id = event;
  PERFORM public.pdh_save_calendar_event_with_registration(event,'update',NULL,stamp,payload || '{"status":"cancelled"}',owner,NULL);
  IF NOT EXISTS (SELECT 1 FROM public.pdh_tournaments WHERE id = tournament AND status = 'cancelled') THEN RAISE EXCEPTION 'Cancel sync failed'; END IF;
  SELECT count(*) INTO count_before FROM public.pdh_events;
  BEGIN
    PERFORM public.pdh_save_calendar_event_with_registration(NULL,'create',NULL,NULL,payload,owner,registration || '{"submission_deadline":"infinity"}');
    -- Force a failure after both inserts, proving PostgreSQL rolls them back together.
    RAISE EXCEPTION 'ROLLBACK_FIXTURE';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'ROLLBACK_FIXTURE' THEN RAISE; END IF;
  END;
  IF (SELECT count(*) FROM public.pdh_events) <> count_before THEN RAISE EXCEPTION 'Partial creation survived rollback'; END IF;
  IF has_function_privilege('anon','public.pdh_save_calendar_event_with_registration(uuid,text,date,timestamptz,jsonb,uuid,jsonb)','EXECUTE')
    OR has_function_privilege('authenticated','public.pdh_save_calendar_event_with_registration(uuid,text,date,timestamptz,jsonb,uuid,jsonb)','EXECUTE') THEN
    RAISE EXCEPTION 'Public registration writes must be denied';
  END IF;
  DELETE FROM public.pdh_tournaments WHERE id = tournament;
  IF EXISTS (SELECT 1 FROM public.pdh_events WHERE id = event AND (tournament_id IS NOT NULL OR registration_url IS NOT NULL)) THEN RAISE EXCEPTION 'Deleted tournament left a broken link'; END IF;
END;
$test$;
