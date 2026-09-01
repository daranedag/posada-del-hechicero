import { CalendarClock, MapPin, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { DeckSubmissionForm } from "@/components/deck-submission-form";
import { formatChileDate, isFutureDate } from "@/lib/dates";
import { getTournamentByCode } from "@/lib/data/catalog";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const tournament = await getTournamentByCode(code);
  return { title: tournament ? `Inscripción · ${tournament.name}` : "Torneo no encontrado" };
}

export default async function TournamentPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const tournament = await getTournamentByCode(code);
  if (!tournament) notFound();
  const canSubmit = tournament.status === "open" && isFutureDate(tournament.submission_deadline);
  return (
    <section className="pdh-container py-12 sm:py-16">
      <div className="mb-8 rounded-[1.25rem] bg-[#281637] p-7 text-[#faf3fc] sm:p-10">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#f0a0ce]"><ShieldCheck className="size-4" /> {tournament.format_code} · Código {tournament.code}</div>
        <h1 className="mt-4 text-balance text-4xl leading-none sm:text-5xl">{tournament.name}</h1>
        <div className="mt-6 grid gap-3 text-sm text-white/65 sm:grid-cols-2">
          <p className="flex items-center gap-2"><CalendarClock className="size-4 text-[#f0a0ce]" /> Torneo: {formatChileDate(tournament.starts_at)}</p>
          <p className="flex items-center gap-2"><MapPin className="size-4 text-[#f0a0ce]" /> {tournament.location}</p>
          <p className="flex items-center gap-2 sm:col-span-2"><CalendarClock className="size-4 text-[#f0a0ce]" /> Cierre de listas: {formatChileDate(tournament.submission_deadline)}</p>
        </div>
        {tournament.public_notes && <p className="mt-6 border-t border-white/10 pt-5 text-sm leading-6 text-white/65">{tournament.public_notes}</p>}
      </div>
      {canSubmit ? <DeckSubmissionForm code={tournament.code} /> : <div className="pdh-panel p-8 text-center"><h2 className="text-3xl">La recepción de listas está cerrada.</h2><p className="mt-3 text-sm text-muted-foreground">Consulta al organizador si necesitas corregir algún dato.</p></div>}
    </section>
  );
}
