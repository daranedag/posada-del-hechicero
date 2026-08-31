import { AtSign, CalendarDays, MapPin } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { formatChileDate, formatChileDay, formatChileMonth } from "@/lib/dates";
import { getUpcomingEvents } from "@/lib/data/catalog";

export const metadata = { title: "Eventos y calendario" };
export const revalidate = 300;

export default async function EventsPage() {
  const events = await getUpcomingEvents();
  const instagram = process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/posada.delhechicero/";
  return (
    <>
      <PageHero kicker="Agenda de la Posada" title="Siempre hay una próxima partida." description="Torneos, encuentros y actividades en un calendario que la tienda puede mantener al día directamente desde InsForge." icon={CalendarDays} />
      <section className="pdh-section pdh-container">
        {events.length ? (
          <div className="grid gap-4">
            {events.map((event) => (
              <article key={event.id} className="pdh-panel grid overflow-hidden sm:grid-cols-[130px_1fr_auto]">
                <div className="flex items-center justify-center gap-3 bg-[#d8a36b] p-6 text-[#2b1b10] sm:flex-col sm:gap-0">
                  <span className="font-display text-5xl font-semibold leading-none">{formatChileDay(event.starts_at)}</span>
                  <span className="text-xs font-bold uppercase tracking-[0.17em]">{formatChileMonth(event.starts_at)}</span>
                </div>
                <div className="p-6 sm:p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal">{event.format_label ?? event.event_type.replaceAll("-", " ")}</p>
                  <h2 className="mt-2 text-3xl leading-none">{event.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{event.description}</p>
                  <p className="mt-4 flex items-center gap-2 text-xs font-bold"><MapPin className="size-4 text-copper" /> {event.location} · {formatChileDate(event.starts_at)}</p>
                </div>
                <div className="flex items-center p-6 pt-0 sm:p-8 sm:pl-0">
                  <a href={event.registration_url ?? instagram} target="_blank" rel="noreferrer" className="pdh-button-primary w-full sm:w-auto">Consultar cupo</a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="pdh-panel flex min-h-80 flex-col items-center justify-center px-6 text-center">
            <CalendarDays className="size-10 text-copper" />
            <h2 className="mt-5 text-4xl">La próxima fecha se está preparando.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">El calendario queda conectado al panel de administración. Mientras se publican las fechas, revisa Instagram para conocer la agenda vigente.</p>
            <a href={instagram} target="_blank" rel="noreferrer" className="pdh-button-primary mt-6"><AtSign className="size-4" /> Ver Instagram</a>
          </div>
        )}
      </section>
    </>
  );
}
