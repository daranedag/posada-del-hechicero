import { publicInsforge } from "@/lib/insforge/public";
import type { Tournament } from "@/lib/types";

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
