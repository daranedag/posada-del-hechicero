import { publicInsforge } from "@/lib/insforge/public";
import type { GameSystem, Product, StoreEvent, Tournament } from "@/lib/types";

export async function getProducts(filters: {
  category?: "board-game" | "tcg" | "accessory";
  gameSystem?: GameSystem;
  limit?: number;
} = {}): Promise<Product[]> {
  let query = publicInsforge.database
    .from("pdh_products")
    .select("id,slug,category,game_system,name,eyebrow,description,price_clp,availability,image_url,is_featured")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .limit(filters.limit ?? 24);

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.gameSystem) query = query.eq("game_system", filters.gameSystem);

  const { data, error } = await query;
  if (error) {
    console.error("No se pudo cargar el catalogo", error);
    return [];
  }
  return (data ?? []) as Product[];
}

export async function getUpcomingEvents(): Promise<StoreEvent[]> {
  const { data, error } = await publicInsforge.database
    .from("pdh_events")
    .select("id,slug,title,description,event_type,format_label,starts_at,ends_at,location,capacity,price_clp,registration_url")
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(24);

  if (error) {
    console.error("No se pudo cargar el calendario", error);
    return [];
  }
  return (data ?? []) as StoreEvent[];
}

export async function getPublicTournaments(): Promise<Tournament[]> {
  const { data, error } = await publicInsforge.database
    .from("pdh_tournaments")
    .select("id,code,name,format_code,starts_at,submission_deadline,location,max_players,public_notes,status")
    .in("status", ["open", "locked", "completed"])
    .order("starts_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("No se pudieron cargar los torneos", error);
    return [];
  }
  return (data ?? []) as Tournament[];
}

export async function getTournamentByCode(code: string): Promise<Tournament | null> {
  const { data, error } = await publicInsforge.database
    .from("pdh_tournaments")
    .select("id,code,name,format_code,starts_at,submission_deadline,location,max_players,public_notes,status")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (error) return null;
  return data as Tournament | null;
}
