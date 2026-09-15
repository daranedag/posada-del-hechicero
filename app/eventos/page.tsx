import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { EventCalendar } from "@/components/events/event-calendar";
import { chileDate, validMonth, type EventOccurrence } from "@/lib/events/calendar";
import { getCalendarMonth } from "@/lib/events/data";

export const metadata = { title: "Eventos y calendario" };
export const dynamic = "force-dynamic";

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { mes } = await searchParams;
  // Dynamic server page: one request-time snapshot keeps client hydration consistent.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const month = validMonth(mes) ? mes : chileDate(now).slice(0, 7);
  let events: EventOccurrence[] = [];
  let error = "";
  try { events = await getCalendarMonth(month); }
  catch { error = "No pudimos cargar las actividades. Inténtalo nuevamente en un momento."; }
  return <>
    <PageHero kicker="Agenda de la Posada" title="Siempre hay una próxima partida." description="Encuentra nuestros encuentros semanales y fechas especiales. Selecciona un día y descubre qué se viene en la Posada." icon={CalendarDays} />
    <section className="pdh-section pdh-container">
      {error ? <div className="pdh-panel p-8" role="alert"><p>{error}</p><Link className="pdh-button-primary mt-4" href={`/eventos?mes=${month}`}>Volver a intentar</Link></div> : <EventCalendar key={month} month={month} events={events} initialNow={now} />}
    </section>
  </>;
}
