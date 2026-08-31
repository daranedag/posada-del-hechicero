import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminInsforge } from "@/lib/insforge/admin";
import { validateDeckList } from "@/lib/mtg/deck-validator";
import type { Tournament, TournamentFormat } from "@/lib/types";

export const runtime = "nodejs";

const submissionSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().or(z.literal("")),
  source: z.enum(["moxfield", "manabox", "arena", "mtgo", "plain-text", "other"]),
  deckList: z.string().trim().min(20).max(100000),
  editToken: z.string().trim().optional(),
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const parsedBody = submissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) return NextResponse.json({ error: "Revisa tus datos y la lista antes de continuar." }, { status: 400 });

  const { code } = await context.params;
  const { data: tournamentData, error: tournamentError } = await adminInsforge.database
    .from("pdh_tournaments")
    .select("id,code,name,format_code,starts_at,submission_deadline,location,max_players,public_notes,status")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (tournamentError || !tournamentData) return NextResponse.json({ error: "El torneo no existe." }, { status: 404 });

  const tournament = tournamentData as Tournament;
  if (tournament.status !== "open") return NextResponse.json({ error: "La recepcion de listas no esta abierta." }, { status: 409 });
  if (Date.now() >= new Date(tournament.submission_deadline).getTime()) return NextResponse.json({ error: "El plazo para editar listas ya termino." }, { status: 409 });

  const { data: formatData, error: formatError } = await adminInsforge.database
    .from("pdh_formats")
    .select("code,label,scryfall_key,min_main_cards,max_sideboard_cards,max_copies")
    .eq("code", tournament.format_code)
    .single();
  if (formatError || !formatData) return NextResponse.json({ error: "No pudimos cargar las reglas del formato." }, { status: 500 });

  let validation;
  try {
    validation = await validateDeckList(parsedBody.data.deckList, formatData as TournamentFormat);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No fue posible validar la lista." }, { status: 503 });
  }
  if (!validation.valid) return NextResponse.json({ error: "La lista aun no es legal.", validation }, { status: 422 });

  const input = parsedBody.data;
  let player: { id: string } | null = null;
  let editToken = input.editToken;

  if (editToken) {
    const { data } = await adminInsforge.database
      .from("pdh_players")
      .select("id")
      .eq("tournament_id", tournament.id)
      .eq("token_hash", hashToken(editToken))
      .maybeSingle();
    player = data as { id: string } | null;
    if (!player) return NextResponse.json({ error: "El enlace de edicion no es valido para este torneo." }, { status: 403 });
    await adminInsforge.database.from("pdh_players").update({ first_name: input.firstName, last_name: input.lastName, email: input.email || null }).eq("id", player.id);
  } else {
    const { data: registered } = await adminInsforge.database.from("pdh_players").select("id").eq("tournament_id", tournament.id);
    if (tournament.max_players && (registered?.length ?? 0) >= tournament.max_players) return NextResponse.json({ error: "El torneo ya alcanzo su cupo maximo." }, { status: 409 });

    editToken = randomBytes(24).toString("base64url");
    const { data, error } = await adminInsforge.database
      .from("pdh_players")
      .insert([{ tournament_id: tournament.id, first_name: input.firstName, last_name: input.lastName, email: input.email || null, token_hash: hashToken(editToken) }])
      .select("id")
      .single();
    if (error || !data) return NextResponse.json({ error: "No pudimos registrar al jugador." }, { status: 500 });
    player = data as { id: string };
  }

  const { data: previous } = await adminInsforge.database
    .from("pdh_deck_submissions")
    .select("id,version_number")
    .eq("player_id", player.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = ((previous as { version_number?: number } | null)?.version_number ?? 0) + 1;
  if (previous) await adminInsforge.database.from("pdh_deck_submissions").update({ is_current: false }).eq("player_id", player.id).eq("is_current", true);

  const { data: submission, error: submissionError } = await adminInsforge.database
    .from("pdh_deck_submissions")
    .insert([{
      tournament_id: tournament.id,
      player_id: player.id,
      version_number: version,
      source: input.source,
      raw_list: input.deckList,
      main_count: validation.mainCount,
      sideboard_count: validation.sideboardCount,
      validation_status: "valid",
      validation_summary: { warnings: validation.warnings, checked_at: new Date().toISOString(), provider: "Scryfall" },
      is_current: true,
    }])
    .select("id")
    .single();

  if (submissionError || !submission) {
    if (previous) await adminInsforge.database.from("pdh_deck_submissions").update({ is_current: true }).eq("id", (previous as { id: string }).id);
    return NextResponse.json({ error: "La lista era legal, pero no pudimos guardarla." }, { status: 500 });
  }

  const { error: cardsError } = await adminInsforge.database.from("pdh_deck_cards").insert(
    validation.cards.map((card) => ({ ...card, submission_id: (submission as { id: string }).id })),
  );
  if (cardsError) {
    await adminInsforge.database.from("pdh_deck_submissions").delete().eq("id", (submission as { id: string }).id);
    if (previous) await adminInsforge.database.from("pdh_deck_submissions").update({ is_current: true }).eq("id", (previous as { id: string }).id);
    return NextResponse.json({ error: "No pudimos guardar el detalle de las cartas." }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  return NextResponse.json({
    success: true,
    version,
    editToken,
    editUrl: `${baseUrl}/torneos/${tournament.code}/editar/${editToken}`,
    validation: { mainCount: validation.mainCount, sideboardCount: validation.sideboardCount, warnings: validation.warnings },
  });
}
