INSERT INTO public.pdh_events (
  slug,
  title,
  description,
  event_type,
  format_label,
  starts_at,
  location,
  registration_url,
  status
)
VALUES (
  'regional-qualifier-standard-2026-11-14',
  'Regional Qualifier · Standard',
  'Fecha clasificatoria de Magic: The Gathering publicada en el calendario regional. Cupos y condiciones deben confirmarse directamente con la tienda.',
  'magic',
  'Standard',
  '2026-11-14T16:00:00Z',
  'La Posada del Hechicero, Aníbal Pinto 1843 Local 3, Valdivia',
  'https://www.instagram.com/posada.delhechicero/',
  'published'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  event_type = EXCLUDED.event_type,
  format_label = EXCLUDED.format_label,
  starts_at = EXCLUDED.starts_at,
  location = EXCLUDED.location,
  registration_url = EXCLUDED.registration_url,
  status = EXCLUDED.status,
  updated_at = NOW();
