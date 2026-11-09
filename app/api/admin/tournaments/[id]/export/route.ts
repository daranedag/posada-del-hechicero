import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin";
import { adminDb } from "@/lib/db/admin";
import { buildMtgtop8Zip, safeExportName, type ExportCard, type ExportPlayer, type ExportStanding, type ExportSubmission, type ExportTournament } from "@/lib/mtg/mtgtop8-export";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const [{ data: tournament }, { data: players }, { data: submissions }, { data: standings }] = await Promise.all([
    adminDb.from("pdh_tournaments").select("id,name,format_code,starts_at,location").eq("id", id).maybeSingle(),
    adminDb.from("pdh_players").select("id,first_name,last_name,email").eq("tournament_id", id),
    adminDb.from("pdh_deck_submissions").select("id,player_id,version_number,archetype").eq("tournament_id", id).eq("is_current", true),
    adminDb.from("pdh_standings").select("player_id,rank,match_points,wins,losses,draws").eq("tournament_id", id).order("rank", { ascending: true }),
  ]);
  if (!tournament) return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  const playerRows = (players ?? []) as unknown as ExportPlayer[];
  const submissionRows = (submissions ?? []) as unknown as ExportSubmission[];
  const standingRows = (standings ?? []) as unknown as ExportStanding[];
  const submissionIds = submissionRows.map((row) => row.id);
  const { data: cards } = submissionIds.length ? await adminDb.from("pdh_deck_cards").select("submission_id,board,quantity,card_name").in("submission_id", submissionIds).order("card_name", { ascending: true }) : { data: [] };
  const cardRows = (cards ?? []) as unknown as ExportCard[];
  const typedTournament = tournament as unknown as ExportTournament;
  const bytes = await buildMtgtop8Zip({ tournament: typedTournament, players: playerRows, submissions: submissionRows, standings: standingRows, cards: cardRows });
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);
  return new NextResponse(body, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${safeExportName(typedTournament.name)}-mtgtop8.zip"` } });
}
