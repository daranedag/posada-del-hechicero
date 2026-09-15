import { z } from "zod";
import { AdminNav } from "@/components/admin-nav";
import { EventForm } from "@/components/events/event-form";
import { requireAdmin } from "@/lib/auth/admin";
import { chileDate, isDate, occurrenceOn, occursOn } from "@/lib/events/calendar";
import { getAdminEvent, getEventException } from "@/lib/events/data";

export const metadata = { title: "Nuevo evento" };
export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ fecha?: string; duplicar?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const duplicate = z.string().uuid().safeParse(params.duplicar);
  const source = duplicate.success ? await getAdminEvent(duplicate.data) : null;
  const date = params.fecha && isDate(params.fecha) ? params.fecha : chileDate();
  const exception = source && source.recurrence_days?.length && occursOn(source, date) ? await getEventException(source.id, date) : null;
  const occurrence = source ? occurrenceOn(source, date, exception ?? undefined) : null;
  return <section className="pdh-container max-w-4xl py-10"><AdminNav /><p className="pdh-kicker">Agenda de la Posada</p><h1 className="mt-3 text-4xl">{source ? "Duplicar evento" : "Nuevo evento"}</h1><p className="mt-3 text-sm text-muted-foreground">{source ? "Revisa la fecha y los detalles de la copia antes de publicarla." : "Crea una actividad especial o una programación semanal."}</p><EventForm key={`${source?.id ?? "new"}:${date}`} date={date} occurrence={occurrence ?? undefined} event={source ?? undefined} duplicateId={source?.id} /></section>;
}
