-- Extracted from the InsForge backup; project objects only. No application data or secrets.
-- Apply with scripts/neon-backup.mjs so schema and data import share one transaction.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'pdh_reader') THEN
    CREATE ROLE pdh_reader NOLOGIN;
  END IF;
END $$;
GRANT pdh_reader TO CURRENT_USER;
CREATE TABLE public.pdh_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  email_verified boolean NOT NULL DEFAULT false,
  profile jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  neon_auth_user_id text UNIQUE
);
CREATE UNIQUE INDEX pdh_users_email_key ON public.pdh_users (lower(email));
CREATE TABLE public.pdh_admins (
    user_id uuid NOT NULL,
    display_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pdh_contact_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pdh_contact_submissions_email_check CHECK (((char_length(email) >= 5) AND (char_length(email) <= 254))),
    CONSTRAINT pdh_contact_submissions_message_check CHECK (((char_length(message) >= 10) AND (char_length(message) <= 4000))),
    CONSTRAINT pdh_contact_submissions_name_check CHECK (((char_length(name) >= 2) AND (char_length(name) <= 120))),
    CONSTRAINT pdh_contact_submissions_status_check CHECK ((status = ANY (ARRAY['new'::text, 'read'::text, 'archived'::text]))),
    CONSTRAINT pdh_contact_submissions_subject_check CHECK (((char_length(subject) >= 2) AND (char_length(subject) <= 160)))
);

CREATE TABLE public.pdh_deck_cards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    board text NOT NULL,
    quantity integer NOT NULL,
    card_name text NOT NULL,
    scryfall_id uuid,
    oracle_id uuid,
    set_code text,
    collector_number text,
    type_line text,
    legality text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pdh_deck_cards_board_check CHECK ((board = ANY (ARRAY['main'::text, 'sideboard'::text]))),
    CONSTRAINT pdh_deck_cards_quantity_check CHECK (((quantity >= 1) AND (quantity <= 999)))
);

CREATE TABLE public.pdh_deck_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tournament_id uuid NOT NULL,
    player_id uuid NOT NULL,
    version_number integer NOT NULL,
    source text NOT NULL,
    raw_list text NOT NULL,
    main_count integer NOT NULL,
    sideboard_count integer NOT NULL,
    validation_status text DEFAULT 'valid'::text NOT NULL,
    validation_summary jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_current boolean DEFAULT true NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    archetype text,
    CONSTRAINT pdh_deck_submissions_archetype_check CHECK (((archetype IS NULL) OR (((char_length(archetype) >= 1) AND (char_length(archetype) <= 120)) AND (archetype = btrim(archetype)) AND (archetype !~ '[\r\n]'::text)))),
    CONSTRAINT pdh_deck_submissions_main_count_check CHECK ((main_count >= 0)),
    CONSTRAINT pdh_deck_submissions_raw_list_check CHECK (((char_length(raw_list) >= 1) AND (char_length(raw_list) <= 100000))),
    CONSTRAINT pdh_deck_submissions_sideboard_count_check CHECK ((sideboard_count >= 0)),
    CONSTRAINT pdh_deck_submissions_source_check CHECK ((source = ANY (ARRAY['moxfield'::text, 'manabox'::text, 'arena'::text, 'mtgo'::text, 'plain-text'::text, 'other'::text]))),
    CONSTRAINT pdh_deck_submissions_validation_status_check CHECK ((validation_status = ANY (ARRAY['valid'::text, 'invalid'::text]))),
    CONSTRAINT pdh_deck_submissions_version_number_check CHECK ((version_number >= 1))
);

CREATE TABLE public.pdh_event_exceptions (
    event_id uuid NOT NULL,
    occurrence_date date NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    event_type text NOT NULL,
    format_label text,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    location text NOT NULL,
    image_url text,
    image_key text,
    cancelled boolean DEFAULT false NOT NULL,
    CONSTRAINT pdh_event_exceptions_check CHECK ((ends_at > starts_at)),
    CONSTRAINT pdh_event_exceptions_check1 CHECK ((((starts_at AT TIME ZONE 'America/Santiago'::text))::date = occurrence_date)),
    CONSTRAINT pdh_event_exceptions_description_check CHECK ((length(description) <= 4000)),
    CONSTRAINT pdh_event_exceptions_event_type_check CHECK ((event_type = ANY (ARRAY['board-game'::text, 'magic'::text, 'pokemon'::text, 'mitos-y-leyendas'::text, 'community'::text]))),
    CONSTRAINT pdh_event_exceptions_title_check CHECK (((length(title) >= 1) AND (length(title) <= 160)))
);

CREATE TABLE public.pdh_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    event_type text NOT NULL,
    format_label text,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone,
    location text DEFAULT 'Anibal Pinto 1843, Local 3, Valdivia'::text NOT NULL,
    capacity integer,
    price_clp integer,
    registration_url text,
    image_url text,
    image_key text,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    recurrence_days smallint[],
    recurrence_until date,
    tournament_id uuid,
    CONSTRAINT pdh_events_capacity_check CHECK (((capacity IS NULL) OR (capacity > 0))),
    CONSTRAINT pdh_events_check CHECK (((ends_at IS NULL) OR (ends_at > starts_at))),
    CONSTRAINT pdh_events_deck_registration_check CHECK (((tournament_id IS NULL) OR ((event_type = 'magic'::text) AND (recurrence_days IS NULL)))),
    CONSTRAINT pdh_events_event_type_check CHECK ((event_type = ANY (ARRAY['board-game'::text, 'magic'::text, 'pokemon'::text, 'mitos-y-leyendas'::text, 'community'::text]))),
    CONSTRAINT pdh_events_price_clp_check CHECK (((price_clp IS NULL) OR (price_clp >= 0))),
    CONSTRAINT pdh_events_recurrence_days_check CHECK (((recurrence_days IS NULL) OR (((cardinality(recurrence_days) >= 1) AND (cardinality(recurrence_days) <= 7)) AND (recurrence_days <@ ARRAY[(0)::smallint, (1)::smallint, (2)::smallint, (3)::smallint, (4)::smallint, (5)::smallint, (6)::smallint]) AND (array_position(recurrence_days, NULL::smallint) IS NULL)))),
    CONSTRAINT pdh_events_recurrence_until_check CHECK (((recurrence_until IS NULL) OR ((recurrence_days IS NOT NULL) AND (recurrence_until >= ((starts_at AT TIME ZONE 'America/Santiago'::text))::date)))),
    CONSTRAINT pdh_events_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'cancelled'::text, 'completed'::text])))
);

CREATE TABLE public.pdh_formats (
    code text NOT NULL,
    label text NOT NULL,
    scryfall_key text NOT NULL,
    min_main_cards integer DEFAULT 60 NOT NULL,
    max_sideboard_cards integer DEFAULT 15 NOT NULL,
    max_copies integer DEFAULT 4 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pdh_formats_max_copies_check CHECK ((max_copies >= 1)),
    CONSTRAINT pdh_formats_max_sideboard_cards_check CHECK ((max_sideboard_cards >= 0)),
    CONSTRAINT pdh_formats_min_main_cards_check CHECK ((min_main_cards >= 1))
);

CREATE TABLE public.pdh_players (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tournament_id uuid NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    token_hash character(64) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pdh_players_first_name_check CHECK (((char_length(first_name) >= 1) AND (char_length(first_name) <= 80))),
    CONSTRAINT pdh_players_last_name_check CHECK (((char_length(last_name) >= 1) AND (char_length(last_name) <= 120)))
);

CREATE TABLE public.pdh_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    category text NOT NULL,
    game_system text,
    name text NOT NULL,
    eyebrow text,
    description text NOT NULL,
    price_clp integer,
    availability text DEFAULT 'consultar'::text NOT NULL,
    image_url text,
    image_key text,
    is_featured boolean DEFAULT false NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pdh_products_availability_check CHECK ((availability = ANY (ARRAY['disponible'::text, 'preventa'::text, 'agotado'::text, 'consultar'::text]))),
    CONSTRAINT pdh_products_category_check CHECK ((category = ANY (ARRAY['board-game'::text, 'tcg'::text, 'accessory'::text]))),
    CONSTRAINT pdh_products_game_system_check CHECK (((game_system IS NULL) OR (game_system = ANY (ARRAY['magic'::text, 'pokemon'::text, 'mitos-y-leyendas'::text])))),
    CONSTRAINT pdh_products_price_clp_check CHECK (((price_clp IS NULL) OR (price_clp >= 0))),
    CONSTRAINT pdh_products_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);

CREATE TABLE public.pdh_site_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    section_key text NOT NULL,
    item_type text DEFAULT 'text'::text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    body text DEFAULT ''::text NOT NULL,
    href text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pdh_site_items_item_type_check CHECK ((item_type = ANY (ARRAY['social'::text, 'address'::text, 'hours'::text, 'contact'::text, 'text'::text])))
);

CREATE TABLE public.pdh_site_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    section_key text NOT NULL,
    image_url text NOT NULL,
    image_key text,
    alt_text text DEFAULT ''::text NOT NULL,
    caption text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pdh_site_media_image_key_check CHECK (((image_key IS NULL) OR (char_length(image_key) > 0)))
);

CREATE TABLE public.pdh_site_sections (
    key text NOT NULL,
    admin_label text NOT NULL,
    kicker text DEFAULT ''::text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    body text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pdh_site_sections_admin_label_check CHECK (((char_length(admin_label) >= 2) AND (char_length(admin_label) <= 80))),
    CONSTRAINT pdh_site_sections_key_check CHECK ((key ~ '^[a-z][a-z0-9_]{1,63}$'::text))
);

CREATE TABLE public.pdh_site_settings (
    key text NOT NULL,
    label text NOT NULL,
    value_text text,
    image_url text,
    image_key text,
    is_public boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pdh_standings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tournament_id uuid NOT NULL,
    player_id uuid NOT NULL,
    rank integer NOT NULL,
    match_points integer DEFAULT 0 NOT NULL,
    wins integer DEFAULT 0 NOT NULL,
    losses integer DEFAULT 0 NOT NULL,
    draws integer DEFAULT 0 NOT NULL,
    opponent_match_win_pct numeric(6,3),
    game_win_pct numeric(6,3),
    opponent_game_win_pct numeric(6,3),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pdh_standings_draws_check CHECK ((draws >= 0)),
    CONSTRAINT pdh_standings_losses_check CHECK ((losses >= 0)),
    CONSTRAINT pdh_standings_match_points_check CHECK ((match_points >= 0)),
    CONSTRAINT pdh_standings_rank_check CHECK ((rank >= 1)),
    CONSTRAINT pdh_standings_wins_check CHECK ((wins >= 0))
);

CREATE TABLE public.pdh_tournaments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    format_code text NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    submission_deadline timestamp with time zone NOT NULL,
    location text DEFAULT 'La Posada del Hechicero, Valdivia'::text NOT NULL,
    max_players integer,
    public_notes text,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pdh_tournaments_code_check CHECK ((code ~ '^[A-Z0-9]{6,12}$'::text)),
    CONSTRAINT pdh_tournaments_max_players_check CHECK (((max_players IS NULL) OR (max_players >= 2))),
    CONSTRAINT pdh_tournaments_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'open'::text, 'locked'::text, 'completed'::text, 'cancelled'::text])))
);
CREATE FUNCTION public.pdh_update_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE FUNCTION public.pdh_clear_deleted_tournament_link() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  IF OLD.tournament_id IS NOT NULL AND NEW.tournament_id IS NULL THEN
    NEW.registration_url := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.pdh_event_is_public(p_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.pdh_events WHERE id = p_id AND status IN ('published','completed'));
$$;

CREATE FUNCTION public.pdh_save_calendar_event(p_id uuid, p_mode text, p_date date, p_expected_updated_at timestamp with time zone, p_values jsonb) RETURNS uuid
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
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

CREATE FUNCTION public.pdh_save_calendar_event_with_registration(p_id uuid, p_mode text, p_date date, p_expected_updated_at timestamp with time zone, p_values jsonb, p_owner_id uuid, p_registration jsonb) RETURNS uuid
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
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
-- PDH_NEON_DATA
ALTER TABLE ONLY public.pdh_admins
    ADD CONSTRAINT pdh_admins_pkey PRIMARY KEY (user_id);

ALTER TABLE ONLY public.pdh_contact_submissions
    ADD CONSTRAINT pdh_contact_submissions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.pdh_deck_cards
    ADD CONSTRAINT pdh_deck_cards_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.pdh_deck_cards
    ADD CONSTRAINT pdh_deck_cards_submission_id_board_card_name_key UNIQUE (submission_id, board, card_name);

ALTER TABLE ONLY public.pdh_deck_submissions
    ADD CONSTRAINT pdh_deck_submissions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.pdh_deck_submissions
    ADD CONSTRAINT pdh_deck_submissions_player_id_version_number_key UNIQUE (player_id, version_number);

ALTER TABLE ONLY public.pdh_event_exceptions
    ADD CONSTRAINT pdh_event_exceptions_pkey PRIMARY KEY (event_id, occurrence_date);

ALTER TABLE ONLY public.pdh_events
    ADD CONSTRAINT pdh_events_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.pdh_events
    ADD CONSTRAINT pdh_events_slug_key UNIQUE (slug);

ALTER TABLE ONLY public.pdh_events
    ADD CONSTRAINT pdh_events_tournament_id_key UNIQUE (tournament_id);

ALTER TABLE ONLY public.pdh_formats
    ADD CONSTRAINT pdh_formats_pkey PRIMARY KEY (code);

ALTER TABLE ONLY public.pdh_formats
    ADD CONSTRAINT pdh_formats_scryfall_key_key UNIQUE (scryfall_key);

ALTER TABLE ONLY public.pdh_players
    ADD CONSTRAINT pdh_players_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.pdh_players
    ADD CONSTRAINT pdh_players_token_hash_key UNIQUE (token_hash);

ALTER TABLE ONLY public.pdh_products
    ADD CONSTRAINT pdh_products_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.pdh_products
    ADD CONSTRAINT pdh_products_slug_key UNIQUE (slug);

ALTER TABLE ONLY public.pdh_site_items
    ADD CONSTRAINT pdh_site_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.pdh_site_media
    ADD CONSTRAINT pdh_site_media_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.pdh_site_sections
    ADD CONSTRAINT pdh_site_sections_pkey PRIMARY KEY (key);

ALTER TABLE ONLY public.pdh_site_settings
    ADD CONSTRAINT pdh_site_settings_pkey PRIMARY KEY (key);

ALTER TABLE ONLY public.pdh_standings
    ADD CONSTRAINT pdh_standings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.pdh_standings
    ADD CONSTRAINT pdh_standings_tournament_id_player_id_key UNIQUE (tournament_id, player_id);

ALTER TABLE ONLY public.pdh_standings
    ADD CONSTRAINT pdh_standings_tournament_id_rank_key UNIQUE (tournament_id, rank);

ALTER TABLE ONLY public.pdh_tournaments
    ADD CONSTRAINT pdh_tournaments_code_key UNIQUE (code);

ALTER TABLE ONLY public.pdh_tournaments
    ADD CONSTRAINT pdh_tournaments_pkey PRIMARY KEY (id);
CREATE INDEX pdh_cards_submission_idx ON public.pdh_deck_cards USING btree (submission_id);

CREATE INDEX pdh_contact_submissions_status_created_idx ON public.pdh_contact_submissions USING btree (status, created_at DESC);

CREATE INDEX pdh_event_exceptions_date_idx ON public.pdh_event_exceptions USING btree (occurrence_date);

CREATE INDEX pdh_events_recurrence_idx ON public.pdh_events USING btree (recurrence_until, starts_at) WHERE (recurrence_days IS NOT NULL);

CREATE INDEX pdh_events_status_starts_idx ON public.pdh_events USING btree (status, starts_at);

CREATE UNIQUE INDEX pdh_one_current_submission_per_player_idx ON public.pdh_deck_submissions USING btree (player_id) WHERE is_current;

CREATE INDEX pdh_players_tournament_idx ON public.pdh_players USING btree (tournament_id);

CREATE INDEX pdh_products_status_sort_idx ON public.pdh_products USING btree (status, sort_order);

CREATE INDEX pdh_site_items_section_sort_idx ON public.pdh_site_items USING btree (section_key, sort_order);

CREATE INDEX pdh_site_media_section_sort_idx ON public.pdh_site_media USING btree (section_key, sort_order);

CREATE INDEX pdh_site_sections_sort_idx ON public.pdh_site_sections USING btree (sort_order);

CREATE INDEX pdh_standings_tournament_rank_idx ON public.pdh_standings USING btree (tournament_id, rank);

CREATE INDEX pdh_submissions_player_current_idx ON public.pdh_deck_submissions USING btree (player_id, is_current);

CREATE INDEX pdh_submissions_tournament_idx ON public.pdh_deck_submissions USING btree (tournament_id);

CREATE INDEX pdh_tournaments_owner_idx ON public.pdh_tournaments USING btree (owner_id);

CREATE INDEX pdh_tournaments_status_deadline_idx ON public.pdh_tournaments USING btree (status, submission_deadline);
ALTER TABLE ONLY public.pdh_admins
    ADD CONSTRAINT pdh_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.pdh_users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.pdh_deck_cards
    ADD CONSTRAINT pdh_deck_cards_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.pdh_deck_submissions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.pdh_deck_submissions
    ADD CONSTRAINT pdh_deck_submissions_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.pdh_players(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.pdh_deck_submissions
    ADD CONSTRAINT pdh_deck_submissions_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.pdh_tournaments(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.pdh_event_exceptions
    ADD CONSTRAINT pdh_event_exceptions_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.pdh_events(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.pdh_events
    ADD CONSTRAINT pdh_events_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.pdh_tournaments(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.pdh_players
    ADD CONSTRAINT pdh_players_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.pdh_tournaments(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.pdh_site_items
    ADD CONSTRAINT pdh_site_items_section_key_fkey FOREIGN KEY (section_key) REFERENCES public.pdh_site_sections(key) ON DELETE CASCADE;

ALTER TABLE ONLY public.pdh_site_media
    ADD CONSTRAINT pdh_site_media_section_key_fkey FOREIGN KEY (section_key) REFERENCES public.pdh_site_sections(key) ON DELETE CASCADE;

ALTER TABLE ONLY public.pdh_standings
    ADD CONSTRAINT pdh_standings_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.pdh_players(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.pdh_standings
    ADD CONSTRAINT pdh_standings_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.pdh_tournaments(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.pdh_tournaments
    ADD CONSTRAINT pdh_tournaments_format_code_fkey FOREIGN KEY (format_code) REFERENCES public.pdh_formats(code) ON UPDATE CASCADE;

ALTER TABLE ONLY public.pdh_tournaments
    ADD CONSTRAINT pdh_tournaments_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.pdh_users(id) ON DELETE RESTRICT;
CREATE TRIGGER pdh_contact_submissions_updated_at BEFORE UPDATE ON public.pdh_contact_submissions FOR EACH ROW EXECUTE FUNCTION public.pdh_update_updated_at();

CREATE TRIGGER pdh_events_clear_tournament_link BEFORE UPDATE ON public.pdh_events FOR EACH ROW EXECUTE FUNCTION public.pdh_clear_deleted_tournament_link();

CREATE TRIGGER pdh_events_updated_at BEFORE UPDATE ON public.pdh_events FOR EACH ROW EXECUTE FUNCTION public.pdh_update_updated_at();

CREATE TRIGGER pdh_players_updated_at BEFORE UPDATE ON public.pdh_players FOR EACH ROW EXECUTE FUNCTION public.pdh_update_updated_at();

CREATE TRIGGER pdh_products_updated_at BEFORE UPDATE ON public.pdh_products FOR EACH ROW EXECUTE FUNCTION public.pdh_update_updated_at();

CREATE TRIGGER pdh_site_items_updated_at BEFORE UPDATE ON public.pdh_site_items FOR EACH ROW EXECUTE FUNCTION public.pdh_update_updated_at();

CREATE TRIGGER pdh_site_media_updated_at BEFORE UPDATE ON public.pdh_site_media FOR EACH ROW EXECUTE FUNCTION public.pdh_update_updated_at();

CREATE TRIGGER pdh_site_sections_updated_at BEFORE UPDATE ON public.pdh_site_sections FOR EACH ROW EXECUTE FUNCTION public.pdh_update_updated_at();

CREATE TRIGGER pdh_site_settings_updated_at BEFORE UPDATE ON public.pdh_site_settings FOR EACH ROW EXECUTE FUNCTION public.pdh_update_updated_at();

CREATE TRIGGER pdh_standings_updated_at BEFORE UPDATE ON public.pdh_standings FOR EACH ROW EXECUTE FUNCTION public.pdh_update_updated_at();

CREATE TRIGGER pdh_tournaments_updated_at BEFORE UPDATE ON public.pdh_tournaments FOR EACH ROW EXECUTE FUNCTION public.pdh_update_updated_at();
ALTER TABLE public."pdh_admins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pdh_contact_submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pdh_deck_cards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pdh_deck_submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pdh_event_exceptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pdh_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pdh_formats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pdh_players" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pdh_products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pdh_site_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pdh_site_media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pdh_site_sections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pdh_site_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pdh_standings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pdh_tournaments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pdh_users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY pdh_event_exceptions_public_read ON public.pdh_event_exceptions FOR SELECT TO pdh_reader USING (public.pdh_event_is_public(event_id));

CREATE POLICY pdh_events_public_read ON public.pdh_events FOR SELECT TO pdh_reader USING ((status = ANY (ARRAY['published'::text, 'completed'::text])));

CREATE POLICY pdh_formats_public_read ON public.pdh_formats FOR SELECT TO pdh_reader USING (is_active);

CREATE POLICY pdh_products_public_read ON public.pdh_products FOR SELECT TO pdh_reader USING ((status = 'published'::text));

CREATE POLICY pdh_site_items_public_read ON public.pdh_site_items FOR SELECT TO pdh_reader USING (is_visible);

CREATE POLICY pdh_site_media_public_read ON public.pdh_site_media FOR SELECT TO pdh_reader USING (is_visible);

CREATE POLICY pdh_site_sections_public_read ON public.pdh_site_sections FOR SELECT TO pdh_reader USING (is_visible);

CREATE POLICY pdh_site_settings_public_read ON public.pdh_site_settings FOR SELECT TO pdh_reader USING (is_public);

CREATE POLICY pdh_tournaments_public_read ON public.pdh_tournaments FOR SELECT TO pdh_reader USING ((status = ANY (ARRAY['open'::text, 'locked'::text, 'completed'::text])));
REVOKE ALL ON public."pdh_admins" FROM PUBLIC;
REVOKE ALL ON public."pdh_contact_submissions" FROM PUBLIC;
REVOKE ALL ON public."pdh_deck_cards" FROM PUBLIC;
REVOKE ALL ON public."pdh_deck_submissions" FROM PUBLIC;
REVOKE ALL ON public."pdh_event_exceptions" FROM PUBLIC;
REVOKE ALL ON public."pdh_events" FROM PUBLIC;
REVOKE ALL ON public."pdh_formats" FROM PUBLIC;
REVOKE ALL ON public."pdh_players" FROM PUBLIC;
REVOKE ALL ON public."pdh_products" FROM PUBLIC;
REVOKE ALL ON public."pdh_site_items" FROM PUBLIC;
REVOKE ALL ON public."pdh_site_media" FROM PUBLIC;
REVOKE ALL ON public."pdh_site_sections" FROM PUBLIC;
REVOKE ALL ON public."pdh_site_settings" FROM PUBLIC;
REVOKE ALL ON public."pdh_standings" FROM PUBLIC;
REVOKE ALL ON public."pdh_tournaments" FROM PUBLIC;
REVOKE ALL ON public."pdh_users" FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO pdh_reader;
GRANT SELECT ON public."pdh_admins" TO pdh_reader;
GRANT SELECT ON public."pdh_contact_submissions" TO pdh_reader;
GRANT SELECT ON public."pdh_deck_cards" TO pdh_reader;
GRANT SELECT ON public."pdh_deck_submissions" TO pdh_reader;
GRANT SELECT ON public."pdh_event_exceptions" TO pdh_reader;
GRANT SELECT ON public."pdh_events" TO pdh_reader;
GRANT SELECT ON public."pdh_formats" TO pdh_reader;
GRANT SELECT ON public."pdh_players" TO pdh_reader;
GRANT SELECT ON public."pdh_products" TO pdh_reader;
GRANT SELECT ON public."pdh_site_items" TO pdh_reader;
GRANT SELECT ON public."pdh_site_media" TO pdh_reader;
GRANT SELECT ON public."pdh_site_sections" TO pdh_reader;
GRANT SELECT ON public."pdh_site_settings" TO pdh_reader;
GRANT SELECT ON public."pdh_standings" TO pdh_reader;
GRANT SELECT ON public."pdh_tournaments" TO pdh_reader;
REVOKE ALL ON FUNCTION public.pdh_clear_deleted_tournament_link() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pdh_event_is_public(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pdh_save_calendar_event(uuid, text, date, timestamp with time zone, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pdh_save_calendar_event_with_registration(uuid, text, date, timestamp with time zone, jsonb, uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pdh_update_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pdh_event_is_public(uuid) TO pdh_reader;
