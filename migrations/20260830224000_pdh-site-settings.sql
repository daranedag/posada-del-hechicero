CREATE TABLE IF NOT EXISTS public.pdh_site_settings (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  value_text TEXT,
  image_url TEXT,
  image_key TEXT,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER pdh_site_settings_updated_at
  BEFORE UPDATE ON public.pdh_site_settings
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

ALTER TABLE public.pdh_site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY pdh_site_settings_public_read ON public.pdh_site_settings
  FOR SELECT TO anon, authenticated USING (is_public);

CREATE POLICY pdh_site_settings_admin_write ON public.pdh_site_settings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pdh_admins WHERE user_id = (SELECT auth.uid())));

REVOKE ALL ON public.pdh_site_settings FROM anon, authenticated;
GRANT SELECT ON public.pdh_site_settings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdh_site_settings TO authenticated;

INSERT INTO public.pdh_site_settings (key, label, value_text, image_url, image_key, is_public)
VALUES (
  'home_hero',
  'Imagen principal',
  'Tu mesa te esta esperando.',
  'https://556adz76.us-east.insforge.app/api/storage/buckets/pdh_media/objects/site%2Fposada-hero.png',
  'site/posada-hero.png',
  TRUE
)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  value_text = EXCLUDED.value_text,
  image_url = EXCLUDED.image_url,
  image_key = EXCLUDED.image_key,
  is_public = EXCLUDED.is_public;
