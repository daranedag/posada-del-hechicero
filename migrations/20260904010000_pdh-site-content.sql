CREATE TABLE IF NOT EXISTS public.pdh_site_sections (
  key TEXT PRIMARY KEY CHECK (key ~ '^[a-z][a-z0-9_]{1,63}$'),
  admin_label TEXT NOT NULL CHECK (char_length(admin_label) BETWEEN 2 AND 80),
  kicker TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pdh_site_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL REFERENCES public.pdh_site_sections(key) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'text' CHECK (item_type IN ('social', 'address', 'hours', 'contact', 'text')),
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  href TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pdh_site_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL REFERENCES public.pdh_site_sections(key) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_key TEXT,
  alt_text TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((image_key IS NULL) OR (char_length(image_key) > 0))
);

CREATE TABLE IF NOT EXISTS public.pdh_contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  email TEXT NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254),
  subject TEXT NOT NULL CHECK (char_length(subject) BETWEEN 2 AND 160),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 4000),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pdh_site_sections_sort_idx
  ON public.pdh_site_sections(sort_order);
CREATE INDEX IF NOT EXISTS pdh_site_items_section_sort_idx
  ON public.pdh_site_items(section_key, sort_order);
CREATE INDEX IF NOT EXISTS pdh_site_media_section_sort_idx
  ON public.pdh_site_media(section_key, sort_order);
CREATE INDEX IF NOT EXISTS pdh_contact_submissions_status_created_idx
  ON public.pdh_contact_submissions(status, created_at DESC);

DROP TRIGGER IF EXISTS pdh_site_sections_updated_at ON public.pdh_site_sections;
CREATE TRIGGER pdh_site_sections_updated_at
  BEFORE UPDATE ON public.pdh_site_sections
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

DROP TRIGGER IF EXISTS pdh_site_items_updated_at ON public.pdh_site_items;
CREATE TRIGGER pdh_site_items_updated_at
  BEFORE UPDATE ON public.pdh_site_items
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

DROP TRIGGER IF EXISTS pdh_site_media_updated_at ON public.pdh_site_media;
CREATE TRIGGER pdh_site_media_updated_at
  BEFORE UPDATE ON public.pdh_site_media
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

DROP TRIGGER IF EXISTS pdh_contact_submissions_updated_at ON public.pdh_contact_submissions;
CREATE TRIGGER pdh_contact_submissions_updated_at
  BEFORE UPDATE ON public.pdh_contact_submissions
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

ALTER TABLE public.pdh_site_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdh_site_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdh_site_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdh_contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pdh_site_sections_public_read ON public.pdh_site_sections;
DROP POLICY IF EXISTS pdh_site_sections_admin_write ON public.pdh_site_sections;
CREATE POLICY pdh_site_sections_public_read ON public.pdh_site_sections
  FOR SELECT TO anon, authenticated
  USING (is_visible);
CREATE POLICY pdh_site_sections_admin_write ON public.pdh_site_sections
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS pdh_site_items_public_read ON public.pdh_site_items;
DROP POLICY IF EXISTS pdh_site_items_admin_write ON public.pdh_site_items;
CREATE POLICY pdh_site_items_public_read ON public.pdh_site_items
  FOR SELECT TO anon, authenticated
  USING (is_visible);
CREATE POLICY pdh_site_items_admin_write ON public.pdh_site_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS pdh_site_media_public_read ON public.pdh_site_media;
DROP POLICY IF EXISTS pdh_site_media_admin_write ON public.pdh_site_media;
CREATE POLICY pdh_site_media_public_read ON public.pdh_site_media
  FOR SELECT TO anon, authenticated
  USING (is_visible);
CREATE POLICY pdh_site_media_admin_write ON public.pdh_site_media
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS pdh_contact_submissions_public_insert ON public.pdh_contact_submissions;
DROP POLICY IF EXISTS pdh_contact_submissions_admin_read ON public.pdh_contact_submissions;
DROP POLICY IF EXISTS pdh_contact_submissions_admin_update ON public.pdh_contact_submissions;
DROP POLICY IF EXISTS pdh_contact_submissions_admin_delete ON public.pdh_contact_submissions;
CREATE POLICY pdh_contact_submissions_public_insert ON public.pdh_contact_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'new');
CREATE POLICY pdh_contact_submissions_admin_read ON public.pdh_contact_submissions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())));
CREATE POLICY pdh_contact_submissions_admin_update ON public.pdh_contact_submissions
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())));
CREATE POLICY pdh_contact_submissions_admin_delete ON public.pdh_contact_submissions
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())));

REVOKE ALL ON public.pdh_site_sections, public.pdh_site_items, public.pdh_site_media,
  public.pdh_contact_submissions FROM anon, authenticated;

GRANT SELECT ON public.pdh_site_sections, public.pdh_site_items, public.pdh_site_media
  TO anon, authenticated;
GRANT INSERT ON public.pdh_contact_submissions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdh_site_sections, public.pdh_site_items,
  public.pdh_site_media, public.pdh_contact_submissions TO authenticated;

INSERT INTO public.pdh_site_sections (key, admin_label, kicker, title, body, sort_order, is_visible)
VALUES
  ('hero', 'Hero principal', 'Tu próxima aventura comienza aquí', 'Una mesa. Mil historias.', 'Juegos de mesa, Magic y torneos para quienes saben que la mejor parte del juego es con quién lo compartes.', 0, TRUE),
  ('social', 'Redes sociales', 'La Posada en línea', 'Síguenos y entérate de todo.', 'Preventas, novedades, lanzamientos y torneos: nuestras redes son el lugar más rápido para saber qué está pasando en la tienda.', 10, TRUE),
  ('address', 'Dirección', 'Ven a conocernos', 'Tu próxima partida está en Valdivia.', 'Estamos en pleno centro de Valdivia. Acércate a descubrir juegos, conocer la comunidad y encontrar una nueva mesa.', 20, TRUE),
  ('hours', 'Horarios', 'Planifica tu visita', '¿Cuándo nos encontramos?', 'Nuestros horarios pueden cambiar durante eventos y días festivos. Confirma las novedades en Instagram antes de venir.', 30, TRUE),
  ('game_request', '¿Buscas algún juego?', 'Te ayudamos a encontrarlo', '¿Buscas algún juego en especial?', 'Cuéntanos cuál buscas. Revisamos disponibilidad y también podemos orientarte si quieres descubrir algo nuevo.', 40, TRUE),
  ('contact', 'Formulario de contacto', 'Hablemos', '¿Tienes alguna duda?', 'Déjanos tu consulta y te responderemos al correo que nos indiques.', 50, TRUE)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.pdh_site_items (id, section_key, item_type, title, body, href, sort_order, is_visible)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'social', 'social', 'Instagram', '@posada.delhechicero', 'https://www.instagram.com/posada.delhechicero/', 10, TRUE),
  ('10000000-0000-4000-8000-000000000002', 'address', 'address', 'La Posada del Hechicero', 'Aníbal Pinto 1843, Local 3, Valdivia', 'https://maps.google.com/?q=Anibal+Pinto+1843+Local+3+Valdivia', 10, TRUE),
  ('10000000-0000-4000-8000-000000000003', 'hours', 'hours', 'Horario actualizado', 'Consulta el horario de hoy en nuestro Instagram.', 'https://www.instagram.com/posada.delhechicero/', 10, TRUE),
  ('10000000-0000-4000-8000-000000000004', 'game_request', 'contact', 'Escríbenos por Instagram', 'Indícanos el nombre del juego y te responderemos con su disponibilidad.', 'https://www.instagram.com/posada.delhechicero/', 10, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pdh_site_media (id, section_key, image_url, image_key, alt_text, caption, sort_order, is_visible)
VALUES
  ('20000000-0000-4000-8000-000000000001', 'hero', '/images/igexport-DMDetjAOfau.jpg', NULL, 'Jugadores reunidos en el local de La Posada del Hechicero en Valdivia', '', 10, TRUE),
  ('20000000-0000-4000-8000-000000000002', 'social', '/images/igexport-DctcBb5keDr.jpg', NULL, 'Afiche de una preventa de Magic: The Gathering en La Posada del Hechicero', 'Prelanzamientos', 10, TRUE),
  ('20000000-0000-4000-8000-000000000003', 'social', '/images/igexport-DT_pelyFKDm.jpg', NULL, 'Afiche de un evento de Magic: The Gathering en La Posada del Hechicero', 'Nuevas colecciones', 20, TRUE),
  ('20000000-0000-4000-8000-000000000004', 'social', '/images/igexport-DYA8_eWluVG.jpg', NULL, 'Afiche de Store Championship de Magic: The Gathering', 'Juego competitivo', 30, TRUE)
ON CONFLICT (id) DO NOTHING;
