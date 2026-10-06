import "server-only";
import { publicInsforge } from "@/lib/insforge/public";
import { adminInsforge } from "@/lib/insforge/admin";
import { addDays, expandEvents, monthRange, type CalendarEvent, type EventException } from "./calendar";

export const eventColumns = "id,slug,title,description,event_type,format_label,starts_at,ends_at,location,image_url,image_key,status,recurrence_days,recurrence_until,updated_at,tournament_id,registration_url";
const exceptionColumns = "event_id,occurrence_date,title,description,event_type,format_label,starts_at,ends_at,location,image_url,image_key,cancelled";

export async function getCalendarMonth(month: string, admin = false) {
  const client = admin ? adminInsforge : publicInsforge;
  const { first, last } = monthRange(month);
  const from = addDays(first, -1);
  const events: CalendarEvent[] = [];
  // Page the relevant definitions instead of truncating the month's calendar.
  for (let offset = 0; ; offset += 200) {
    let query = client.database.from("pdh_events").select(eventColumns)
      .lt("starts_at", `${addDays(last, 2)}T00:00:00Z`)
      .or(`and(recurrence_days.is.null,starts_at.gte.${from}T00:00:00Z),and(recurrence_days.not.is.null,or(recurrence_until.is.null,recurrence_until.gte.${from}))`)
      .order("id").range(offset, offset + 199);
    if (!admin) query = query.in("status", ["published", "completed"]);
    const { data, error } = await query;
    if (error) throw new Error("No se pudo cargar el calendario. Inténtalo nuevamente.");
    events.push(...(data ?? []) as CalendarEvent[]);
    if (!data || data.length < 200) break;
  }
  const exceptions: EventException[] = [];
  for (let offset = 0; ; offset += 200) {
    const { data, error } = await client.database.from("pdh_event_exceptions").select(exceptionColumns)
      .gte("occurrence_date", from).lte("occurrence_date", last)
      .order("event_id").order("occurrence_date").range(offset, offset + 199);
    if (error) throw new Error("No se pudieron cargar los cambios de fechas. Inténtalo nuevamente.");
    exceptions.push(...(data ?? []) as EventException[]);
    if (!data || data.length < 200) break;
  }
  return expandEvents(events, exceptions, from, last);
}

export async function getAdminEvent(id: string) {
  const { data, error } = await adminInsforge.database.from("pdh_events").select(eventColumns).eq("id", id).maybeSingle();
  if (error) throw new Error("No se pudo cargar el evento.");
  return data as CalendarEvent | null;
}
export async function getEventException(id: string, date: string) {
  const { data, error } = await adminInsforge.database.from("pdh_event_exceptions").select(exceptionColumns).eq("event_id", id).eq("occurrence_date", date).maybeSingle();
  if (error) throw new Error("No se pudo cargar esta fecha.");
  return data as EventException | null;
}
