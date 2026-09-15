import { notFound } from "next/navigation";
import { z } from "zod";
import { AdminNav } from "@/components/admin-nav";
import { EventForm } from "@/components/events/event-form";
import { requireAdmin } from "@/lib/auth/admin";
import { addDays, chileDate, isDate, occurrenceOn, occursOn } from "@/lib/events/calendar";
import { getAdminEvent, getEventException } from "@/lib/events/data";

export const metadata = { title: "Editar evento" };
export default async function EditEventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ fecha?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const event = await getAdminEvent(id);
  if (!event) notFound();
  const { fecha } = await searchParams;
  let date = chileDate(event.starts_at);
  if (event.recurrence_days?.length) {
    const today = chileDate();
    date = today > date && (!event.recurrence_until || today <= event.recurrence_until) ? today : date;
    for (let i = 0; i < 7 && !occursOn(event, date); i++) date = addDays(date, 1);
    if (!occursOn(event, date)) {
      date = chileDate(event.starts_at);
      for (let i = 0; i < 7 && !occursOn(event, date); i++) date = addDays(date, 1);
    }
  }
  if (fecha && isDate(fecha) && occursOn(event, fecha)) date = fecha;
  const exception = event.recurrence_days?.length ? await getEventException(id, date) : null;
  const occurrence = occurrenceOn(event, date, exception ?? undefined);
  if (!occurrence) notFound();
  return <section className="pdh-container max-w-4xl py-10"><AdminNav /><p className="pdh-kicker">Agenda de la Posada</p><h1 className="mt-3 text-4xl">Editar evento</h1><p className="mt-3 text-sm text-muted-foreground">{event.title} · {date}</p><EventForm key={`${id}:${date}:${event.updated_at}`} event={event} occurrence={occurrence} date={date} /></section>;
}
