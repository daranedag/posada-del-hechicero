import "server-only";
import { publicDb } from "@/lib/db/public";
import { adminDb } from "@/lib/db/admin";
import { queryDatabase } from "@/lib/db/server";
import { addDays, expandEvents, monthRange, type CalendarEvent, type EventException } from "./calendar";

export const eventColumns = "id,slug,title,description,event_type,format_label,starts_at,ends_at,location,image_url,image_key,status,recurrence_days,recurrence_until,updated_at,tournament_id,registration_url";
const exceptionColumns = "event_id,occurrence_date,title,description,event_type,format_label,starts_at,ends_at,location,image_url,image_key,cancelled";

export async function getCalendarMonth(month: string, admin = false) {
  const client = admin ? adminDb : publicDb;
  const { first, last } = monthRange(month);
  const from = addDays(first, -1);
  const events: CalendarEvent[] = [];
  // Page the relevant definitions instead of truncating the month's calendar.
  for (let offset = 0; ; offset += 200) {
    const { rows } = await queryDatabase(admin ? "admin" : "public", `
      SELECT ${eventColumns} FROM public.pdh_events
      WHERE starts_at < $1::timestamptz
        AND ((recurrence_days IS NULL AND starts_at >= $2::timestamptz)
          OR (recurrence_days IS NOT NULL AND (recurrence_until IS NULL OR recurrence_until >= $3::date)))
      ORDER BY id LIMIT 200 OFFSET $4`, [`${addDays(last, 2)}T00:00:00Z`, `${from}T00:00:00Z`, from, offset]);
    events.push(...rows as unknown as CalendarEvent[]);
    if (rows.length < 200) break;
  }
  const exceptions: EventException[] = [];
  for (let offset = 0; ; offset += 200) {
    const { data, error } = await client.from("pdh_event_exceptions").select(exceptionColumns)
      .gte("occurrence_date", from).lte("occurrence_date", last)
      .order("event_id").order("occurrence_date").range(offset, offset + 199);
    if (error) throw new Error("No se pudieron cargar los cambios de fechas. Inténtalo nuevamente.");
    exceptions.push(...(data ?? []) as unknown as EventException[]);
    if (!data || data.length < 200) break;
  }
  return expandEvents(events, exceptions, from, last);
}

export async function getAdminEvent(id: string) {
  const { data, error } = await adminDb.from("pdh_events").select(eventColumns).eq("id", id).maybeSingle();
  if (error) throw new Error("No se pudo cargar el evento.");
  return data as CalendarEvent | null;
}
export async function getEventException(id: string, date: string) {
  const { data, error } = await adminDb.from("pdh_event_exceptions").select(exceptionColumns).eq("event_id", id).eq("occurrence_date", date).maybeSingle();
  if (error) throw new Error("No se pudo cargar esta fecha.");
  return data as unknown as EventException | null;
}
