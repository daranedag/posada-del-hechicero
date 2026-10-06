ALTER TABLE public.pdh_events
  ADD COLUMN tournament_id uuid UNIQUE REFERENCES public.pdh_tournaments(id) ON DELETE SET NULL,
  ADD CONSTRAINT pdh_events_deck_registration_check CHECK (
    tournament_id IS NULL OR (event_type = 'magic' AND recurrence_days IS NULL)
  );

CREATE FUNCTION public.pdh_clear_deleted_tournament_link() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF OLD.tournament_id IS NOT NULL AND NEW.tournament_id IS NULL THEN
    NEW.registration_url := NULL;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER pdh_events_clear_tournament_link BEFORE UPDATE ON public.pdh_events
FOR EACH ROW EXECUTE FUNCTION public.pdh_clear_deleted_tournament_link();

-- Reuse the calendar's concurrency checks; both inserts commit or roll back together.
CREATE FUNCTION public.pdh_save_calendar_event_with_registration(
  p_id uuid, p_mode text, p_date date, p_expected_updated_at timestamptz,
  p_values jsonb, p_owner_id uuid, p_registration jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  target_id uuid;
  tournament uuid;
  tournament_code text;
  saved public.pdh_events%ROWTYPE;
  deadline timestamptz;
BEGIN
  IF p_registration IS NOT NULL THEN
    IF p_mode <> 'create' OR p_values->>'event_type' <> 'magic'
      OR (p_values->'recurrence_days' IS NOT NULL AND p_values->'recurrence_days' <> 'null'::jsonb)
      OR p_registration->>'format_code' IS NULL
      OR p_registration->>'format_code' NOT IN ('standard','pioneer','modern','pauper')
      OR NOT EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = p_owner_id)
    THEN RAISE EXCEPTION 'Invalid deck registration'; END IF;
    deadline := (p_registration->>'submission_deadline')::timestamptz;
    IF deadline IS NULL THEN RAISE EXCEPTION 'Invalid submission deadline'; END IF;
  END IF;

  target_id := public.pdh_save_calendar_event(p_id, p_mode, p_date, p_expected_updated_at, p_values);
  SELECT * INTO saved FROM public.pdh_events WHERE id = target_id;
  IF p_registration IS NOT NULL THEN
    LOOP
      tournament_code := 'PDH' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 9));
      INSERT INTO public.pdh_tournaments(owner_id, code, name, format_code, starts_at,
        submission_deadline, location, public_notes, status)
      VALUES (p_owner_id, tournament_code, saved.title, p_registration->>'format_code', saved.starts_at,
        deadline, saved.location, nullif(saved.description, ''),
        CASE saved.status WHEN 'published' THEN 'open' WHEN 'cancelled' THEN 'cancelled' ELSE 'draft' END)
      ON CONFLICT (code) DO NOTHING RETURNING id INTO tournament;
      EXIT WHEN tournament IS NOT NULL;
    END LOOP;
    UPDATE public.pdh_events SET tournament_id = tournament,
      registration_url = '/torneos/' || tournament_code WHERE id = target_id;
  ELSIF saved.tournament_id IS NOT NULL THEN
    UPDATE public.pdh_tournaments SET name = saved.title, starts_at = saved.starts_at,
      location = saved.location, public_notes = nullif(saved.description, ''),
      status = CASE saved.status WHEN 'draft' THEN 'draft' WHEN 'cancelled' THEN 'cancelled'
        WHEN 'published' THEN CASE WHEN status IN ('draft','cancelled') THEN 'open' ELSE status END
        ELSE status END
    WHERE id = saved.tournament_id;
  END IF;
  RETURN target_id;
END;
$$;
REVOKE ALL ON FUNCTION public.pdh_save_calendar_event_with_registration(uuid,text,date,timestamptz,jsonb,uuid,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pdh_save_calendar_event_with_registration(uuid,text,date,timestamptz,jsonb,uuid,jsonb) TO project_admin;
