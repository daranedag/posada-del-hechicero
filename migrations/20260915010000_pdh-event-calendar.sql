-- Additive calendar schema. Existing events and tournament tables are preserved.
ALTER TABLE public.pdh_events
  ADD COLUMN recurrence_days smallint[],
  ADD COLUMN recurrence_until date,
  ADD CONSTRAINT pdh_events_recurrence_days_check CHECK (
    recurrence_days IS NULL OR (cardinality(recurrence_days) BETWEEN 1 AND 7
      AND recurrence_days <@ ARRAY[0,1,2,3,4,5,6]::smallint[]
      AND array_position(recurrence_days, NULL) IS NULL)
  ),
  ADD CONSTRAINT pdh_events_recurrence_until_check CHECK (
    recurrence_until IS NULL OR (recurrence_days IS NOT NULL
      AND recurrence_until >= (starts_at AT TIME ZONE 'America/Santiago')::date)
  );
CREATE INDEX pdh_events_recurrence_idx ON public.pdh_events(recurrence_until, starts_at)
  WHERE recurrence_days IS NOT NULL;

CREATE TABLE public.pdh_event_exceptions (
  event_id uuid NOT NULL REFERENCES public.pdh_events(id) ON DELETE CASCADE,
  occurrence_date date NOT NULL,
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  description text NOT NULL CHECK (length(description) <= 4000),
  event_type text NOT NULL CHECK (event_type IN ('board-game','magic','pokemon','mitos-y-leyendas','community')),
  format_label text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  location text NOT NULL,
  image_url text,
  image_key text,
  cancelled boolean NOT NULL DEFAULT false,
  PRIMARY KEY (event_id, occurrence_date),
  CHECK ((starts_at AT TIME ZONE 'America/Santiago')::date = occurrence_date)
);
CREATE INDEX pdh_event_exceptions_date_idx ON public.pdh_event_exceptions(occurrence_date);
ALTER TABLE public.pdh_event_exceptions ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.pdh_event_is_public(p_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.pdh_events WHERE id = p_id AND status IN ('published','completed'));
$$;
REVOKE ALL ON FUNCTION public.pdh_event_is_public(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pdh_event_is_public(uuid) TO anon, authenticated;
CREATE POLICY pdh_event_exceptions_public_read ON public.pdh_event_exceptions
  FOR SELECT TO anon, authenticated USING (public.pdh_event_is_public(event_id));
REVOKE ALL ON public.pdh_event_exceptions FROM anon, authenticated;
GRANT SELECT ON public.pdh_event_exceptions TO anon, authenticated;

-- Only the authorized server action (project_admin client) may invoke this RPC.
-- A single transaction and row lock keep edits, series splits and exceptions together.
CREATE FUNCTION public.pdh_save_calendar_event(
  p_id uuid, p_mode text, p_date date, p_expected_updated_at timestamptz, p_values jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = public, pg_temp AS $$
DECLARE
  previous public.pdh_events%ROWTYPE;
  incoming public.pdh_events%ROWTYPE;
  target_id uuid;
  first_date date;
BEGIN
  IF p_mode NOT IN ('create','update','occurrence','future') THEN RAISE EXCEPTION 'Invalid edit mode'; END IF;
  incoming := jsonb_populate_record(NULL::public.pdh_events, p_values);
  IF incoming.title IS NULL OR length(trim(incoming.title)) NOT BETWEEN 1 AND 160
    OR incoming.description IS NULL OR length(incoming.description) > 4000
    OR incoming.starts_at IS NULL OR incoming.ends_at IS NULL OR incoming.ends_at <= incoming.starts_at
    OR incoming.location IS NULL OR length(trim(incoming.location)) NOT BETWEEN 1 AND 300
    OR incoming.status NOT IN ('draft','published','cancelled')
  THEN RAISE EXCEPTION 'Invalid event fields'; END IF;

  IF p_mode <> 'create' THEN
    SELECT * INTO previous FROM public.pdh_events WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;
    IF p_expected_updated_at IS NULL OR previous.updated_at <> p_expected_updated_at THEN
      RAISE EXCEPTION 'EVENT_CONFLICT';
    END IF;
    first_date := (previous.starts_at AT TIME ZONE 'America/Santiago')::date;
    IF p_mode IN ('occurrence','future') THEN
      IF previous.recurrence_days IS NULL OR p_date IS NULL OR p_date < first_date
        OR (previous.recurrence_until IS NOT NULL AND p_date > previous.recurrence_until)
        OR NOT (extract(dow FROM p_date)::smallint = ANY(previous.recurrence_days))
      THEN RAISE EXCEPTION 'Invalid occurrence'; END IF;
    ELSIF previous.recurrence_days IS NOT NULL THEN
      RAISE EXCEPTION 'Recurring events require a dated edit';
    END IF;
  END IF;

  IF p_mode = 'occurrence' THEN
    IF incoming.status = 'draft' THEN RAISE EXCEPTION 'An exception cannot be a draft'; END IF;
    INSERT INTO public.pdh_event_exceptions(event_id, occurrence_date, title, description, event_type, format_label, starts_at, ends_at, location, image_url, image_key, cancelled)
    VALUES (p_id, p_date, incoming.title, incoming.description, incoming.event_type, incoming.format_label, incoming.starts_at, incoming.ends_at, incoming.location, incoming.image_url, incoming.image_key, incoming.status = 'cancelled')
    ON CONFLICT (event_id, occurrence_date) DO UPDATE SET
      title = EXCLUDED.title, description = EXCLUDED.description, event_type = EXCLUDED.event_type,
      format_label = EXCLUDED.format_label, starts_at = EXCLUDED.starts_at, ends_at = EXCLUDED.ends_at,
      location = EXCLUDED.location, image_url = EXCLUDED.image_url, image_key = EXCLUDED.image_key,
      cancelled = EXCLUDED.cancelled;
    UPDATE public.pdh_events SET updated_at = clock_timestamp() WHERE id = p_id;
    RETURN p_id;
  END IF;

  IF p_mode = 'future' THEN
    IF (incoming.starts_at AT TIME ZONE 'America/Santiago')::date <> p_date THEN
      RAISE EXCEPTION 'Series must start on the selected date';
    END IF;
    IF p_date > first_date THEN
      UPDATE public.pdh_events SET recurrence_until = p_date - 1 WHERE id = p_id;
    END IF;
  END IF;

  IF p_mode = 'update' OR (p_mode = 'future' AND p_date = first_date) THEN
    target_id := p_id;
    UPDATE public.pdh_events SET title = incoming.title, description = incoming.description,
      event_type = incoming.event_type, format_label = incoming.format_label,
      starts_at = incoming.starts_at, ends_at = incoming.ends_at, location = incoming.location,
      image_url = incoming.image_url, image_key = incoming.image_key, status = incoming.status,
      recurrence_days = incoming.recurrence_days, recurrence_until = incoming.recurrence_until
    WHERE id = p_id;
  ELSE
    INSERT INTO public.pdh_events(slug, title, description, event_type, format_label, starts_at, ends_at,
      location, image_url, image_key, status, recurrence_days, recurrence_until)
    VALUES ('evento-' || gen_random_uuid()::text, incoming.title, incoming.description, incoming.event_type,
      incoming.format_label, incoming.starts_at, incoming.ends_at, incoming.location,
      incoming.image_url, incoming.image_key, incoming.status, incoming.recurrence_days, incoming.recurrence_until)
    RETURNING id INTO target_id;
  END IF;

  IF p_mode = 'future' THEN
    -- Preserve deliberate future exceptions that still belong to the new schedule.
    -- The selected date uses the newly edited values, not its previous exception.
    UPDATE public.pdh_event_exceptions SET event_id = target_id
    WHERE event_id = p_id AND occurrence_date > p_date
      AND incoming.recurrence_days IS NOT NULL
      AND extract(dow FROM occurrence_date)::smallint = ANY(incoming.recurrence_days)
      AND (incoming.recurrence_until IS NULL OR occurrence_date <= incoming.recurrence_until);
    DELETE FROM public.pdh_event_exceptions
    WHERE event_id = p_id AND occurrence_date >= p_date
      AND (target_id <> p_id OR occurrence_date = p_date OR incoming.recurrence_days IS NULL
        OR NOT (extract(dow FROM occurrence_date)::smallint = ANY(incoming.recurrence_days))
        OR (incoming.recurrence_until IS NOT NULL AND occurrence_date > incoming.recurrence_until));
  END IF;
  RETURN target_id;
END;
$$;
REVOKE ALL ON FUNCTION public.pdh_save_calendar_event(uuid,text,date,timestamptz,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pdh_save_calendar_event(uuid,text,date,timestamptz,jsonb) TO project_admin;
