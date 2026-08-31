import { createHash } from "node:crypto";
import { notFound } from "next/navigation";
import { DeckSubmissionForm } from "@/components/deck-submission-form";
import { adminInsforge } from "@/lib/insforge/admin";
import { getTournamentByCode } from "@/lib/data/catalog";
import { isFutureDate } from "@/lib/dates";

export const metadata = { title: "Editar decklist" };
export const dynamic = "force-dynamic";

export default async function EditDeckPage({ params }: { params: Promise<{ code: string; token: string }> }) {
  const { code, token } = await params;
  const tournament = await getTournamentByCode(code);
  if (!tournament || tournament.status !== "open" || !isFutureDate(tournament.submission_deadline)) notFound();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data: player } = await adminInsforge.database.from("pdh_players").select("id,first_name,last_name,email").eq("tournament_id", tournament.id).eq("token_hash", tokenHash).maybeSingle();
  if (!player) notFound();
  const { data: submission } = await adminInsforge.database.from("pdh_deck_submissions").select("source,raw_list").eq("player_id", (player as { id: string }).id).eq("is_current", true).maybeSingle();
  if (!submission) notFound();
  const typedPlayer = player as { first_name: string; last_name: string; email: string | null };
  const typedSubmission = submission as { source: string; raw_list: string };
  return (
    <section className="pdh-container py-12 sm:py-16">
      <div className="mb-8 max-w-3xl"><p className="pdh-kicker">Enlace privado</p><h1 className="mt-4 text-5xl leading-none">Actualizar mi decklist</h1><p className="mt-4 text-sm leading-6 text-muted-foreground">{tournament.name}. Al guardar se crea una nueva versión y la anterior queda disponible para auditoría del organizador.</p></div>
      <DeckSubmissionForm code={tournament.code} defaults={{ firstName: typedPlayer.first_name, lastName: typedPlayer.last_name, email: typedPlayer.email ?? "", source: typedSubmission.source, deckList: typedSubmission.raw_list, editToken: token }} />
    </section>
  );
}
