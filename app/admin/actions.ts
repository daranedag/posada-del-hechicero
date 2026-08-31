"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { chileLocalToIso } from "@/lib/dates-server";
import { adminInsforge } from "@/lib/insforge/admin";

const tournamentSchema = z.object({
  name: z.string().trim().min(3).max(180),
  formatCode: z.enum(["standard", "pioneer", "modern", "pauper"]),
  startsAt: z.string().min(16),
  deadline: z.string().min(16),
  location: z.string().trim().min(3).max(240),
  maxPlayers: z.coerce.number().int().min(2).max(1000).optional(),
  notes: z.string().trim().max(3000),
});

function createCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(5);
  return `PDH${[...bytes].map((byte) => alphabet[byte % alphabet.length]).join("")}`;
}

export async function createTournamentAction(formData: FormData) {
  const user = await requireAdmin();
  const input = tournamentSchema.safeParse({
    name: formData.get("name"), formatCode: formData.get("formatCode"), startsAt: formData.get("startsAt"), deadline: formData.get("deadline"),
    location: formData.get("location"), maxPlayers: formData.get("maxPlayers") || undefined, notes: formData.get("notes") ?? "",
  });
  if (!input.success) redirect("/admin/torneos/nuevo?error=datos");

  const startsAt = chileLocalToIso(input.data.startsAt);
  const deadline = chileLocalToIso(input.data.deadline);
  if (new Date(deadline) > new Date(startsAt)) redirect("/admin/torneos/nuevo?error=fecha");

  const code = createCode();
  const { data, error } = await adminInsforge.database.from("pdh_tournaments").insert([{
    owner_id: user.id, code, name: input.data.name, format_code: input.data.formatCode, starts_at: startsAt,
    submission_deadline: deadline, location: input.data.location, max_players: input.data.maxPlayers ?? null,
    public_notes: input.data.notes || null, status: "open",
  }]).select("id").single();
  if (error || !data) redirect("/admin/torneos/nuevo?error=guardar");
  revalidatePath("/torneos");
  redirect(`/admin/torneos/${(data as { id: string }).id}`);
}

export async function updateTournamentStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["open", "locked", "completed", "cancelled"].includes(status)) return;
  await adminInsforge.database.from("pdh_tournaments").update({ status }).eq("id", id);
  revalidatePath(`/admin/torneos/${id}`);
  revalidatePath("/torneos");
}

export async function saveStandingsAction(formData: FormData) {
  await requireAdmin();
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const playerIds = formData.getAll("playerId").map(String);
  if (!tournamentId || !playerIds.length) return;
  const rows = playerIds.map((playerId) => ({
    tournament_id: tournamentId, player_id: playerId,
    rank: Number(formData.get(`rank:${playerId}`) ?? 0), match_points: Number(formData.get(`points:${playerId}`) ?? 0),
    wins: Number(formData.get(`wins:${playerId}`) ?? 0), losses: Number(formData.get(`losses:${playerId}`) ?? 0), draws: Number(formData.get(`draws:${playerId}`) ?? 0),
  })).filter((row) => row.rank > 0);
  if (!rows.length || new Set(rows.map((row) => row.rank)).size !== rows.length) return;
  const { data: backup } = await adminInsforge.database.from("pdh_standings").select("tournament_id,player_id,rank,match_points,wins,losses,draws,opponent_match_win_pct,game_win_pct,opponent_game_win_pct").eq("tournament_id", tournamentId);
  await adminInsforge.database.from("pdh_standings").delete().eq("tournament_id", tournamentId);
  const { error } = await adminInsforge.database.from("pdh_standings").insert(rows);
  if (error && backup?.length) await adminInsforge.database.from("pdh_standings").insert(backup);
  revalidatePath(`/admin/torneos/${tournamentId}`);
}
