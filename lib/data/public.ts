import { publicDb } from "@/lib/db/public";

export interface SiteSetting {
  key: string;
  label: string;
  value_text: string | null;
  image_url: string | null;
  image_key: string | null;
}

export async function getSiteSetting(key: string): Promise<SiteSetting | null> {
  const { data, error } = await publicDb
    .from("pdh_site_settings")
    .select("key,label,value_text,image_url,image_key")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    console.error("No se pudo cargar la configuracion publica", error);
    return null;
  }

  const setting = data as SiteSetting | null;
  if (setting?.image_url === "https://556adz76.us-east.insforge.app/api/storage/buckets/pdh_media/objects/site%2Fposada-hero.png") {
    return { ...setting, image_url: "/images/posada-hero.png" };
  }
  return setting;
}
