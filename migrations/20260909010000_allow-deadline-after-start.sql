-- El cierre de listas es una fecha operativa independiente del inicio del torneo.
ALTER TABLE public.pdh_tournaments
  DROP CONSTRAINT IF EXISTS pdh_tournaments_check;
