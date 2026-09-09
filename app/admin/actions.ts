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
const tournamentIdSchema = z.string().uuid();
const tournamentStatusSchema = z.enum(["open", "locked", "completed", "cancelled"]);
const deadlineSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

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
  const id = tournamentIdSchema.safeParse(formData.get("id"));
  const status = tournamentStatusSchema.safeParse(formData.get("status"));
  if (!id.success || !status.success) redirect("/admin?estado=torneo-error");

  const { data, error } = await adminInsforge.database
    .from("pdh_tournaments")
    .update({ status: status.data })
    .eq("id", id.data)
    .select("id,code,status")
    .maybeSingle();

  const updatedTournament = data as { id: string; code: string; status: string } | null;
  if (error || !updatedTournament || updatedTournament.status !== status.data) {
    redirect(`/admin/torneos/${id.data}?estado=error`);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/torneos/${id.data}`);
  revalidatePath("/torneos");
  revalidatePath(`/torneos/${updatedTournament.code}`);
  redirect(`/admin/torneos/${id.data}?estado=actualizado`);
}

export async function updateTournamentDeadlineAction(formData: FormData) {
  await requireAdmin();
  const id = tournamentIdSchema.safeParse(formData.get("id"));
  if (!id.success) redirect("/admin?estado=torneo-error");

  const deadlineInput = deadlineSchema.safeParse(formData.get("deadline"));
  if (!deadlineInput.success) redirect(`/admin/torneos/${id.data}?estado=error-cierre`);
  const deadline = chileLocalToIso(deadlineInput.data);

  const { data, error } = await adminInsforge.database
    .from("pdh_tournaments")
    .update({ submission_deadline: deadline })
    .eq("id", id.data)
    .select("id,code,submission_deadline")
    .maybeSingle();

  const updatedTournament = data as { id: string; code: string; submission_deadline: string } | null;
  if (
    error
    || !updatedTournament
    || new Date(updatedTournament.submission_deadline).getTime() !== new Date(deadline).getTime()
  ) {
    redirect(`/admin/torneos/${id.data}?estado=error-cierre`);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/torneos/${id.data}`);
  revalidatePath("/torneos");
  revalidatePath(`/torneos/${updatedTournament.code}`);
  redirect(`/admin/torneos/${id.data}?estado=cierre-actualizado`);
}

export async function deleteTournamentAction(formData: FormData) {
  await requireAdmin();
  const id = tournamentIdSchema.safeParse(formData.get("id"));
  if (!id.success) redirect("/admin?estado=torneo-error");

  const { data, error } = await adminInsforge.database
    .from("pdh_tournaments")
    .delete()
    .eq("id", id.data)
    .select("id,code")
    .maybeSingle();

  const deletedTournament = data as { id: string; code: string } | null;
  if (error || !deletedTournament) redirect(`/admin/torneos/${id.data}?estado=error-eliminar`);

  revalidatePath("/admin");
  revalidatePath("/torneos");
  revalidatePath(`/torneos/${deletedTournament.code}`);
  redirect("/admin?estado=torneo-eliminado");
}

export async function deleteTournamentPlayerAction(formData: FormData) {
  await requireAdmin();
  const tournamentId = tournamentIdSchema.safeParse(formData.get("tournamentId"));
  const playerId = tournamentIdSchema.safeParse(formData.get("playerIdToDelete"));
  if (!tournamentId.success) redirect("/admin?estado=jugador-error");
  if (!playerId.success) redirect(`/admin/torneos/${tournamentId.data}?estado=error-jugador`);

  const { data, error } = await adminInsforge.database
    .from("pdh_players")
    .delete()
    .eq("id", playerId.data)
    .eq("tournament_id", tournamentId.data)
    .select("id")
    .maybeSingle();

  if (error || !data) redirect(`/admin/torneos/${tournamentId.data}?estado=error-jugador`);

  revalidatePath(`/admin/torneos/${tournamentId.data}`);
  redirect(`/admin/torneos/${tournamentId.data}?estado=jugador-eliminado`);
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
