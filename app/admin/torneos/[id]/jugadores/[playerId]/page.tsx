import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, History } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { formatChileDate } from "@/lib/dates";
import { adminInsforge } from "@/lib/insforge/admin";

export const dynamic = "force-dynamic";

type Submission = {
  id: string;
  version_number: number;
  source: string;
  raw_list: string;
  main_count: number;
  sideboard_count: number;
  validation_status: string;
  validation_summary: { warnings?: string[]; checked_at?: string; provider?: string } | null;
  is_current: boolean;
  submitted_at: string;
};

type Card = {
  submission_id: string;
  board: "main" | "sideboard";
  quantity: number;
  card_name: string;
  legality: string;
};

export default async function PlayerDecksPage({
  params,
}: {
  params: Promise<{ id: string; playerId: string }>;
}) {
  const user = await requireAdmin();
  const { id, playerId } = await params;
  const [{ data: tournament }, { data: player }, { data: submissions }] = await Promise.all([
    adminInsforge.database.from("pdh_tournaments").select("id,name,code,format_code").eq("id", id).maybeSingle(),
    adminInsforge.database.from("pdh_players").select("id,first_name,last_name,email,created_at").eq("id", playerId).eq("tournament_id", id).maybeSingle(),
    adminInsforge.database.from("pdh_deck_submissions").select("id,version_number,source,raw_list,main_count,sideboard_count,validation_status,validation_summary,is_current,submitted_at").eq("player_id", playerId).eq("tournament_id", id).order("version_number", { ascending: false }),
  ]);
  if (!tournament || !player) notFound();

  const submissionRows = (submissions ?? []) as Submission[];
  const submissionIds = submissionRows.map((submission) => submission.id);
  const { data: cards } = submissionIds.length
    ? await adminInsforge.database.from("pdh_deck_cards").select("submission_id,board,quantity,card_name,legality").in("submission_id", submissionIds).order("card_name", { ascending: true })
    : { data: [] };
  const cardRows = (cards ?? []) as Card[];
  const typedTournament = tournament as { name: string; code: string; format_code: string };
  const typedPlayer = player as { first_name: string; last_name: string; email: string | null };

  return (
    <section className="pdh-container py-10 sm:py-14">
      <AdminNav name={(user.admin as { display_name?: string }).display_name ?? user.email} />
      <Link href={`/admin/torneos/${id}`} className="inline-flex items-center gap-2 text-sm font-bold text-teal">
        <ArrowLeft className="size-4" /> Volver al torneo
      </Link>
      <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="pdh-kicker">{typedTournament.format_code} · Historial privado</p>
          <h1 className="mt-4 text-5xl leading-none">{typedPlayer.first_name} {typedPlayer.last_name}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{typedPlayer.email ?? "Sin email"} · {typedTournament.name}</p>
        </div>
        <div className="rounded-xl bg-secondary px-5 py-4 text-sm">
          <p className="font-bold">{submissionRows.length} {submissionRows.length === 1 ? "versión" : "versiones"}</p>
          <p className="mt-1 text-xs text-muted-foreground">La versión vigente aparece primero.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6">
        {submissionRows.map((submission) => {
          const submissionCards = cardRows.filter((card) => card.submission_id === submission.id);
          const main = submissionCards.filter((card) => card.board === "main");
          const sideboard = submissionCards.filter((card) => card.board === "sideboard");
          return (
            <article key={submission.id} className="pdh-panel overflow-hidden">
              <div className="flex flex-col justify-between gap-4 border-b border-foreground/10 bg-secondary/45 p-5 sm:flex-row sm:items-center sm:px-7">
                <div className="flex items-center gap-3">
                  <span className={`grid size-10 place-items-center rounded-full ${submission.is_current ? "bg-emerald-100 text-emerald-900" : "bg-muted text-muted-foreground"}`}>
                    {submission.is_current ? <CheckCircle2 className="size-5" /> : <History className="size-5" />}
                  </span>
                  <div><h2 className="text-2xl">Versión {submission.version_number}{submission.is_current ? " · Vigente" : ""}</h2><p className="text-xs text-muted-foreground">{formatChileDate(submission.submitted_at)} · {submission.source}</p></div>
                </div>
                <div className="flex gap-2 text-xs font-bold"><span className="rounded-full bg-background px-3 py-1.5">{submission.main_count} main</span><span className="rounded-full bg-background px-3 py-1.5">{submission.sideboard_count} side</span></div>
              </div>
              <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[1fr_1fr_0.9fr]">
                <DeckColumn title="Mazo principal" cards={main} />
                <DeckColumn title="Sideboard" cards={sideboard} />
                <div><p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-teal"><Clock3 className="size-4" /> Texto recibido</p><pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl bg-[#281637] p-4 text-xs leading-5 text-[#faf3fc]">{submission.raw_list}</pre></div>
              </div>
            </article>
          );
        })}
        {!submissionRows.length && <div className="pdh-panel p-9 text-center text-muted-foreground">Este jugador todavía no ha enviado una lista.</div>}
      </div>
    </section>
  );
}

function DeckColumn({ title, cards }: { title: string; cards: Card[] }) {
  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.13em] text-teal">{title}</p>
      <div className="grid gap-1.5">
        {cards.map((card) => <div key={`${card.submission_id}-${card.board}-${card.card_name}`} className="flex gap-3 rounded-md bg-secondary/50 px-3 py-2 text-sm"><span className="w-6 shrink-0 font-bold">{card.quantity}</span><span>{card.card_name}</span></div>)}
        {!cards.length && <p className="text-sm text-muted-foreground">Sin cartas.</p>}
      </div>
    </div>
  );
}
