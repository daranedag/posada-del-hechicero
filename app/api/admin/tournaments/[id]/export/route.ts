import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin";
import { adminInsforge } from "@/lib/insforge/admin";
import { buildMtgtop8Zip, safeExportName, type ExportCard, type ExportPlayer, type ExportStanding, type ExportSubmission, type ExportTournament } from "@/lib/mtg/mtgtop8-export";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const [{ data: tournament }, { data: players }, { data: submissions }, { data: standings }] = await Promise.all([
    adminInsforge.database.from("pdh_tournaments").select("id,name,format_code,starts_at,location").eq("id", id).maybeSingle(),
    adminInsforge.database.from("pdh_players").select("id,first_name,last_name,email").eq("tournament_id", id),
    adminInsforge.database.from("pdh_deck_submissions").select("id,player_id,version_number").eq("tournament_id", id).eq("is_current", true),
    adminInsforge.database.from("pdh_standings").select("player_id,rank,match_points,wins,losses,draws").eq("tournament_id", id).order("rank", { ascending: true }),
  ]);
  if (!tournament) return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  const playerRows = (players ?? []) as ExportPlayer[];
  const submissionRows = (submissions ?? []) as ExportSubmission[];
  const standingRows = (standings ?? []) as ExportStanding[];
  const submissionIds = submissionRows.map((row) => row.id);
  const { data: cards } = submissionIds.length ? await adminInsforge.database.from("pdh_deck_cards").select("submission_id,board,quantity,card_name").in("submission_id", submissionIds).order("card_name", { ascending: true }) : { data: [] };
  const cardRows = (cards ?? []) as ExportCard[];
  const typedTournament = tournament as ExportTournament;
  const bytes = await buildMtgtop8Zip({ tournament: typedTournament, players: playerRows, submissions: submissionRows, standings: standingRows, cards: cardRows });
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);
  return new NextResponse(body, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${safeExportName(typedTournament.name)}-mtgtop8.zip"` } });
}
