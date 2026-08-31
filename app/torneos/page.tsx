import Link from "next/link";
import { ArrowRight, ClipboardCheck, LockKeyhole, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { getPublicTournaments } from "@/lib/data/catalog";
import { formatChileDate } from "@/lib/dates";

export const metadata = { title: "Portal de torneos" };

export default async function TournamentsPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const tournaments = await getPublicTournaments();
  const { code = "" } = await searchParams;
  return (
    <>
      <PageHero kicker="Portal de torneos" title="Tu decklist, lista antes de la primera ronda." description="Inscripción digital, historial de versiones y validación automática de legalidad para Modern, Standard, Pauper y Pioneer." icon={ShieldCheck} />
      <section className="pdh-section pdh-container grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
        <aside>
          <div className="pdh-panel sticky top-28 p-6 sm:p-8">
            <ClipboardCheck className="size-7 text-copper" />
            <h2 className="mt-5 text-3xl">Tengo un código</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Escríbelo tal como aparece en la invitación del organizador.</p>
            <form className="mt-5" action="/torneos/abrir">
              <label className="sr-only" htmlFor="code">Código del torneo</label>
              <input id="code" name="code" defaultValue={code} required minLength={6} maxLength={12} className="pdh-input uppercase" placeholder="EJ: PDH8K2" />
              <button className="pdh-button-primary mt-3 w-full">Abrir inscripción <ArrowRight className="size-4" /></button>
            </form>
            <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><LockKeyhole className="mt-0.5 size-4 shrink-0" /> Después de enviar recibirás un enlace privado para actualizar tu lista hasta la hora de cierre.</p>
          </div>
        </aside>
        <div>
          <p className="pdh-kicker">Torneos publicados</p>
          <h2 className="mt-4 text-4xl">Elige tu evento</h2>
          <div className="mt-7 grid gap-4">
            {tournaments.length ? tournaments.map((tournament) => (
              <Link key={tournament.id} href={`/torneos/${tournament.code}`} className="pdh-panel group flex flex-col justify-between gap-5 p-6 transition hover:-translate-y-0.5 hover:border-copper/50 sm:flex-row sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase">{tournament.format_code}</span><span className="text-xs font-bold text-muted-foreground">Código {tournament.code}</span></div>
                  <h3 className="mt-3 text-2xl">{tournament.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{formatChileDate(tournament.starts_at)} · {tournament.location}</p>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-bold text-teal">{tournament.status === "open" ? "Inscribir mazo" : "Ver torneo"}<ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
              </Link>
            )) : (
              <div className="pdh-panel p-8"><h3 className="text-3xl">No hay torneos públicos todavía.</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Cuando el administrador abra un torneo, aparecerá aquí y su enlace podrá compartirse con los participantes.</p></div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
