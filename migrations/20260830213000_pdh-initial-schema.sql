CREATE TABLE IF NOT EXISTS public.pdh_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pdh_formats (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  scryfall_key TEXT NOT NULL UNIQUE,
  min_main_cards INTEGER NOT NULL DEFAULT 60 CHECK (min_main_cards >= 1),
  max_sideboard_cards INTEGER NOT NULL DEFAULT 15 CHECK (max_sideboard_cards >= 0),
  max_copies INTEGER NOT NULL DEFAULT 4 CHECK (max_copies >= 1),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pdh_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('board-game', 'tcg', 'accessory')),
  game_system TEXT CHECK (game_system IS NULL OR game_system IN ('magic', 'pokemon', 'mitos-y-leyendas')),
  name TEXT NOT NULL,
  eyebrow TEXT,
  description TEXT NOT NULL,
  price_clp INTEGER CHECK (price_clp IS NULL OR price_clp >= 0),
  availability TEXT NOT NULL DEFAULT 'consultar' CHECK (availability IN ('disponible', 'preventa', 'agotado', 'consultar')),
  image_url TEXT,
  image_key TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pdh_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('board-game', 'magic', 'pokemon', 'mitos-y-leyendas', 'community')),
  format_label TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location TEXT NOT NULL DEFAULT 'Anibal Pinto 1843, Local 3, Valdivia',
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  price_clp INTEGER CHECK (price_clp IS NULL OR price_clp >= 0),
  registration_url TEXT,
  image_url TEXT,
  image_key TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);

-- PDH_APPLY_CHUNK_END

CREATE TABLE IF NOT EXISTS public.pdh_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  code TEXT NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9]{6,12}$'),
  name TEXT NOT NULL,
  format_code TEXT NOT NULL REFERENCES public.pdh_formats(code) ON UPDATE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  submission_deadline TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL DEFAULT 'La Posada del Hechicero, Valdivia',
  max_players INTEGER CHECK (max_players IS NULL OR max_players >= 2),
  public_notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'locked', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (submission_deadline <= starts_at)
);

CREATE TABLE IF NOT EXISTS public.pdh_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.pdh_tournaments(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL CHECK (char_length(first_name) BETWEEN 1 AND 80),
  last_name TEXT NOT NULL CHECK (char_length(last_name) BETWEEN 1 AND 120),
  email TEXT,
  token_hash CHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PDH_APPLY_CHUNK_END

CREATE TABLE IF NOT EXISTS public.pdh_deck_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.pdh_tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.pdh_players(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number >= 1),
  source TEXT NOT NULL CHECK (source IN ('moxfield', 'manabox', 'arena', 'mtgo', 'plain-text', 'other')),
  raw_list TEXT NOT NULL CHECK (char_length(raw_list) BETWEEN 1 AND 100000),
  main_count INTEGER NOT NULL CHECK (main_count >= 0),
  sideboard_count INTEGER NOT NULL CHECK (sideboard_count >= 0),
  validation_status TEXT NOT NULL DEFAULT 'valid' CHECK (validation_status IN ('valid', 'invalid')),
  validation_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (player_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.pdh_deck_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.pdh_deck_submissions(id) ON DELETE CASCADE,
  board TEXT NOT NULL CHECK (board IN ('main', 'sideboard')),
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 999),
  card_name TEXT NOT NULL,
  scryfall_id UUID,
  oracle_id UUID,
  set_code TEXT,
  collector_number TEXT,
  type_line TEXT,
  legality TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id, board, card_name)
);

CREATE TABLE IF NOT EXISTS public.pdh_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.pdh_tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.pdh_players(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL CHECK (rank >= 1),
  match_points INTEGER NOT NULL DEFAULT 0 CHECK (match_points >= 0),
  wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
  losses INTEGER NOT NULL DEFAULT 0 CHECK (losses >= 0),
  draws INTEGER NOT NULL DEFAULT 0 CHECK (draws >= 0),
  opponent_match_win_pct NUMERIC(6,3),
  game_win_pct NUMERIC(6,3),
  opponent_game_win_pct NUMERIC(6,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tournament_id, player_id),
  UNIQUE (tournament_id, rank)
);

CREATE INDEX IF NOT EXISTS pdh_products_status_sort_idx ON public.pdh_products(status, sort_order);
CREATE INDEX IF NOT EXISTS pdh_events_status_starts_idx ON public.pdh_events(status, starts_at);
CREATE INDEX IF NOT EXISTS pdh_tournaments_owner_idx ON public.pdh_tournaments(owner_id);
CREATE INDEX IF NOT EXISTS pdh_tournaments_status_deadline_idx ON public.pdh_tournaments(status, submission_deadline);
CREATE INDEX IF NOT EXISTS pdh_players_tournament_idx ON public.pdh_players(tournament_id);
CREATE INDEX IF NOT EXISTS pdh_submissions_tournament_idx ON public.pdh_deck_submissions(tournament_id);
CREATE INDEX IF NOT EXISTS pdh_submissions_player_current_idx ON public.pdh_deck_submissions(player_id, is_current);
CREATE INDEX IF NOT EXISTS pdh_cards_submission_idx ON public.pdh_deck_cards(submission_id);
CREATE INDEX IF NOT EXISTS pdh_standings_tournament_rank_idx ON public.pdh_standings(tournament_id, rank);

CREATE UNIQUE INDEX IF NOT EXISTS pdh_one_current_submission_per_player_idx
  ON public.pdh_deck_submissions(player_id)
  WHERE is_current;

-- PDH_APPLY_CHUNK_END

-- PDH_APPLY_CHUNK_END
-- PDH_APPLY_CHUNK_END

CREATE TRIGGER pdh_products_updated_at
  BEFORE UPDATE ON public.pdh_products
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

CREATE TRIGGER pdh_events_updated_at
  BEFORE UPDATE ON public.pdh_events
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

CREATE TRIGGER pdh_tournaments_updated_at
  BEFORE UPDATE ON public.pdh_tournaments
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

CREATE TRIGGER pdh_players_updated_at
  BEFORE UPDATE ON public.pdh_players
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

CREATE TRIGGER pdh_standings_updated_at
  BEFORE UPDATE ON public.pdh_standings
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

ALTER TABLE public.pdh_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdh_formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdh_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdh_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdh_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdh_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdh_deck_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdh_deck_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdh_standings ENABLE ROW LEVEL SECURITY;

-- PDH_APPLY_CHUNK_END

CREATE POLICY pdh_admins_read ON public.pdh_admins
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY pdh_formats_public_read ON public.pdh_formats
  FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY pdh_formats_admin_write ON public.pdh_formats
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())));

CREATE POLICY pdh_products_public_read ON public.pdh_products
  FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY pdh_products_admin_write ON public.pdh_products
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())));

CREATE POLICY pdh_events_public_read ON public.pdh_events
  FOR SELECT TO anon, authenticated USING (status IN ('published', 'completed'));
CREATE POLICY pdh_events_admin_write ON public.pdh_events
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())));

CREATE POLICY pdh_tournaments_public_read ON public.pdh_tournaments
  FOR SELECT TO anon, authenticated USING (status IN ('open', 'locked', 'completed'));
CREATE POLICY pdh_tournaments_admin_write ON public.pdh_tournaments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())));

CREATE POLICY pdh_players_admin_all ON public.pdh_players
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())));
CREATE POLICY pdh_submissions_admin_all ON public.pdh_deck_submissions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())));
CREATE POLICY pdh_cards_admin_all ON public.pdh_deck_cards
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())));
CREATE POLICY pdh_standings_admin_all ON public.pdh_standings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())));

GRANT USAGE ON SCHEMA public TO anon, authenticated;
REVOKE ALL ON public.pdh_admins, public.pdh_formats, public.pdh_products, public.pdh_events,
  public.pdh_tournaments, public.pdh_players, public.pdh_deck_submissions,
  public.pdh_deck_cards, public.pdh_standings FROM anon, authenticated;

GRANT SELECT ON public.pdh_formats, public.pdh_products, public.pdh_events, public.pdh_tournaments TO anon, authenticated;
GRANT SELECT ON public.pdh_admins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdh_formats, public.pdh_products, public.pdh_events,
  public.pdh_tournaments, public.pdh_players, public.pdh_deck_submissions,
  public.pdh_deck_cards, public.pdh_standings TO authenticated;

INSERT INTO public.pdh_formats (code, label, scryfall_key, min_main_cards, max_sideboard_cards, max_copies)
VALUES
  ('standard', 'Standard', 'standard', 60, 15, 4),
  ('pioneer', 'Pioneer', 'pioneer', 60, 15, 4),
  ('modern', 'Modern', 'modern', 60, 15, 4),
  ('pauper', 'Pauper', 'pauper', 60, 15, 4)
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  scryfall_key = EXCLUDED.scryfall_key,
  min_main_cards = EXCLUDED.min_main_cards,
  max_sideboard_cards = EXCLUDED.max_sideboard_cards,
  max_copies = EXCLUDED.max_copies,
  is_active = TRUE;
