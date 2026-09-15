DO $test$
DECLARE
  original_id uuid;
  split_id uuid;
  original_stamp timestamptz;
  payload jsonb := '{"title":"Calendar rehearsal","description":"Temporary rollback fixture","event_type":"community","location":"Test location","starts_at":"2026-09-04T22:00:00Z","ends_at":"2026-09-05T00:00:00Z","status":"draft","recurrence_days":[5],"recurrence_until":null}';
  count_rows integer;
BEGIN
  original_id := public.pdh_save_calendar_event(NULL, 'create', NULL, NULL, payload);
  SELECT updated_at INTO original_stamp FROM public.pdh_events WHERE id = original_id;
  PERFORM public.pdh_save_calendar_event(original_id, 'occurrence', '2026-09-11', original_stamp,
    payload || '{"starts_at":"2026-09-11T21:00:00Z","ends_at":"2026-09-11T23:00:00Z","status":"cancelled"}'::jsonb);
  IF NOT EXISTS (SELECT 1 FROM public.pdh_event_exceptions WHERE event_id = original_id AND occurrence_date = '2026-09-11' AND cancelled) THEN
    RAISE EXCEPTION 'Exception cancellation failed';
  END IF;
  SELECT updated_at INTO original_stamp FROM public.pdh_events WHERE id = original_id;
  PERFORM public.pdh_save_calendar_event(original_id, 'occurrence', '2026-09-25', original_stamp,
    payload || '{"starts_at":"2026-09-25T21:00:00Z","ends_at":"2026-09-25T23:00:00Z","status":"published","title":"Preserved exception"}'::jsonb);
  SELECT updated_at INTO original_stamp FROM public.pdh_events WHERE id = original_id;
  split_id := public.pdh_save_calendar_event(original_id, 'future', '2026-09-18', original_stamp,
    payload || '{"starts_at":"2026-09-18T21:00:00Z","ends_at":"2026-09-18T23:00:00Z","status":"published","title":"New schedule"}'::jsonb);
  IF NOT EXISTS (SELECT 1 FROM public.pdh_events WHERE id = original_id AND recurrence_until = '2026-09-17') THEN
    RAISE EXCEPTION 'History was not bounded correctly';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.pdh_event_exceptions WHERE event_id = original_id AND occurrence_date = '2026-09-11') THEN
    RAISE EXCEPTION 'Historical exception was lost';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.pdh_event_exceptions WHERE event_id = split_id AND occurrence_date = '2026-09-25' AND title = 'Preserved exception') THEN
    RAISE EXCEPTION 'Future exception was not preserved';
  END IF;
  IF public.pdh_event_is_public(original_id) OR NOT public.pdh_event_is_public(split_id) THEN
    RAISE EXCEPTION 'Public visibility is incorrect';
  END IF;
  IF has_function_privilege('anon', 'public.pdh_save_calendar_event(uuid,text,date,timestamptz,jsonb)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.pdh_save_calendar_event(uuid,text,date,timestamptz,jsonb)', 'EXECUTE')
    OR has_table_privilege('anon', 'public.pdh_event_exceptions', 'INSERT') THEN
    RAISE EXCEPTION 'Public writes must be denied';
  END IF;
  SET LOCAL ROLE anon;
  SELECT count(*) INTO count_rows FROM public.pdh_event_exceptions WHERE event_id IN (original_id, split_id);
  IF count_rows <> 1 THEN RAISE EXCEPTION 'Anonymous RLS exposed draft exceptions or hid published ones'; END IF;
  RESET ROLE;
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO count_rows FROM public.pdh_event_exceptions WHERE event_id IN (original_id, split_id);
  IF count_rows <> 1 THEN RAISE EXCEPTION 'Authenticated RLS visibility is incorrect'; END IF;
  RESET ROLE;
  BEGIN
    PERFORM public.pdh_save_calendar_event(split_id, 'future', '2026-09-25', '2000-01-01'::timestamptz, payload);
    RAISE EXCEPTION 'Conflict was not detected';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'EVENT_CONFLICT' THEN RAISE; END IF;
  END;
  SELECT count(*) INTO count_rows FROM public.pdh_events WHERE id IN (original_id, split_id);
  IF count_rows <> 2 THEN RAISE EXCEPTION 'Unexpected series count'; END IF;
END $test$;
