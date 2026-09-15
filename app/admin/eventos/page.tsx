import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminNav } from "@/components/admin-nav";
import { EventCalendar } from "@/components/events/event-calendar";
import { requireAdmin } from "@/lib/auth/admin";
import { adminInsforge } from "@/lib/insforge/admin";
import { chileDate, validMonth, weekdays, type CalendarEvent, type EventOccurrence } from "@/lib/events/calendar";
import { getCalendarMonth } from "@/lib/events/data";

export const metadata = { title: "Administrar eventos" };
export const dynamic = "force-dynamic";
const statuses = { draft: "Borrador", published: "Publicado", cancelled: "Cancelado", completed: "Finalizado" };
export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ mes?: string; pagina?: string; estado?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  // Dynamic server page: one request-time snapshot keeps client hydration consistent.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const month = validMonth(params.mes) ? params.mes : chileDate(now).slice(0, 7);
  const page = /^\d{1,5}$/.test(params.pagina ?? "") ? Math.max(1, Number(params.pagina)) : 1;
  let events: EventOccurrence[] = [];
  let calendarError = "";
  try { events = await getCalendarMonth(month, true); }
  catch { calendarError = "No pudimos cargar el calendario. Vuelve a intentar en un momento."; }
  const { data, error, count } = await adminInsforge.database.from("pdh_events")
    .select("id,title,status,starts_at,recurrence_days,recurrence_until", { count: "exact" })
    .order("updated_at", { ascending: false }).order("id").range((page - 1) * 20, page * 20 - 1);
  const templates = (data ?? []) as Pick<CalendarEvent, "id" | "title" | "status" | "starts_at" | "recurrence_days" | "recurrence_until">[];
  return <section className="pdh-container py-10 sm:py-14">
    <AdminNav />
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="pdh-kicker">Agenda de la Posada</p><h1 className="mt-3 text-5xl">Eventos</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Publica encuentros semanales y fechas especiales. Selecciona un día para agregar, editar o cancelar una actividad.</p></div><Link href="/admin/eventos/nuevo" className="pdh-button-primary"><Plus className="size-4" /> Nuevo evento</Link></div>
    {params.estado === "guardado" && <p role="status" className="mb-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">Evento guardado. Los cambios publicados ya están disponibles en el calendario.</p>}
    {calendarError ? <p role="alert" className="pdh-panel p-6">{calendarError}</p> : <EventCalendar key={month} month={month} events={events} initialNow={now} admin />}
    <section className="mt-12" aria-labelledby="event-library"><h2 id="event-library" className="text-3xl">Todas las programaciones</h2><p className="mt-2 text-sm text-muted-foreground">Incluye borradores, actividades pasadas y canceladas. Los torneos se administran por separado.</p>
      {error ? <p role="alert" className="mt-5">No pudimos cargar las programaciones.</p> : <div className="mt-5 grid gap-3">{templates.map(event => <article key={event.id} className="pdh-panel flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="text-xs font-bold text-teal">{statuses[event.status]} · {event.recurrence_days?.length ? "Semanal" : "Especial"}</p><h3 className="mt-2 text-2xl">{event.title}</h3><p className="mt-2 text-sm text-muted-foreground">{event.recurrence_days?.length ? `${event.recurrence_days.map(day => weekdays[day]).join(", ")} · Desde ${chileDate(event.starts_at)}${event.recurrence_until ? ` hasta ${event.recurrence_until}` : ""}` : chileDate(event.starts_at)}</p></div><div className="flex flex-wrap gap-2"><Link className="pdh-button-secondary" href={`/admin/eventos/${event.id}`}>Editar</Link><Link className="pdh-button-secondary" href={`/admin/eventos/nuevo?duplicar=${event.id}`}>Duplicar</Link></div></article>)}{!templates.length && <p className="pdh-panel p-6">No hay programaciones en esta página.</p>}</div>}
      <div className="mt-5 flex items-center gap-4">{page > 1 && <Link href={`/admin/eventos?mes=${month}&pagina=${page - 1}`} className="pdh-button-secondary">Anterior</Link>}<span className="text-sm">Página {page}</span>{page * 20 < (count ?? 0) && <Link href={`/admin/eventos?mes=${month}&pagina=${page + 1}`} className="pdh-button-secondary">Siguiente</Link>}</div>
    </section>
  </section>;
}
