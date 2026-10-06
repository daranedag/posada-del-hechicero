-- Existing submissions have no declared archetype; preserve them as NULL.
-- New submissions require a trimmed, single-line archetype in the API.
ALTER TABLE public.pdh_deck_submissions
  ADD COLUMN IF NOT EXISTS archetype TEXT
  CHECK (
    archetype IS NULL OR (
      char_length(archetype) BETWEEN 1 AND 120
      AND archetype = btrim(archetype)
      AND archetype !~ E'[\\r\\n]'
    )
  );
