import { publicInsforge } from "@/lib/insforge/public";

export interface SiteSetting {
  key: string;
  label: string;
  value_text: string | null;
  image_url: string | null;
  image_key: string | null;
}

export async function getSiteSetting(key: string): Promise<SiteSetting | null> {
  const { data, error } = await publicInsforge.database
    .from("pdh_site_settings")
    .select("key,label,value_text,image_url,image_key")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    console.error("No se pudo cargar la configuracion publica", error);
    return null;
  }

  return data as SiteSetting | null;
}
