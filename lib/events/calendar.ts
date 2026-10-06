export const EVENT_ZONE = "America/Santiago";
export const EVENT_TYPES = ["board-game", "magic", "pokemon", "mitos-y-leyendas", "community"] as const;
export const eventTypeLabels: Record<string, string> = { "board-game": "Juegos de mesa", magic: "Magic", pokemon: "Pokémon", "mitos-y-leyendas": "Mitos y Leyendas", community: "Comunidad" };
export const weekdays = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export interface CalendarEvent {
  id: string; slug: string; title: string; description: string;
  event_type: typeof EVENT_TYPES[number]; format_label: string | null;
  starts_at: string; ends_at: string | null; location: string;
  image_url: string | null; image_key: string | null;
  status: "draft" | "published" | "cancelled" | "completed";
  recurrence_days: number[] | null; recurrence_until: string | null;
  updated_at: string;
  tournament_id?: string | null;
  registration_url?: string | null;
}
export interface EventException {
  event_id: string; occurrence_date: string; title: string; description: string;
  event_type: typeof EVENT_TYPES[number]; format_label: string | null;
  starts_at: string; ends_at: string; location: string;
  image_url: string | null; image_key: string | null; cancelled: boolean;
}
export interface EventOccurrence extends CalendarEvent {
  occurrence_date: string; occurrence_id: string; recurring: boolean; cancelled: boolean;
}

const localFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: EVENT_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
export function chileLocal(value: string | number | Date): string {
  return localFormatter.format(new Date(value)).replace(" ", "T");
}
export function chileDate(value: string | number | Date = new Date()): string { return chileLocal(value).slice(0, 10); }
export function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number(value.slice(0, 4)) >= 2000 && Number(value.slice(0, 4)) <= 2100 && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function addDays(date: string, days: number): string {
  const instant = new Date(`${date}T12:00:00Z`); instant.setUTCDate(instant.getUTCDate() + days);
  return instant.toISOString().slice(0, 10);
}
export function monthRange(month: string) {
  const first = `${month}-01`;
  const next = new Date(`${first}T12:00:00Z`); next.setUTCMonth(next.getUTCMonth() + 1);
  return { first, last: addDays(next.toISOString().slice(0, 10), -1) };
}
export function validMonth(value: unknown): value is string { return typeof value === "string" && /^\d{4}-\d{2}$/.test(value) && isDate(`${value}-01`); }
export function shiftMonth(month: string, direction: number): string {
  const value = new Date(`${month}-01T12:00:00Z`); value.setUTCMonth(value.getUTCMonth() + direction); return value.toISOString().slice(0, 7);
}

/** Convert wall-clock time to an instant, including Chilean DST. Reject missing hours.
 * For a repeated hour, choose the earlier occurrence deterministically. */
export function chileInstant(local: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local) || !isDate(local.slice(0, 10))) return null;
  const wall = Date.parse(`${local}:00Z`);
  if (!Number.isFinite(wall)) return null;
  const offsets = new Set<number>();
  for (const delta of [-36, 0, 36]) {
    const sample = wall + delta * 3600000;
    offsets.add(Date.parse(`${chileLocal(sample)}:00Z`) - sample);
  }
  const matches = [...offsets].map(offset => wall - offset).filter(value => chileLocal(value) === local).sort((a, b) => a - b);
  return matches.length ? new Date(matches[0]).toISOString() : null;
}
export function occursOn(event: CalendarEvent, date: string): boolean {
  if (!isDate(date)) return false;
  const startDate = chileDate(event.starts_at);
  if (!event.recurrence_days?.length) return date === startDate;
  return date >= startDate && (!event.recurrence_until || date <= event.recurrence_until) && event.recurrence_days.includes(new Date(`${date}T12:00:00Z`).getUTCDay());
}
export function occurrenceOn(event: CalendarEvent, date: string, exception?: EventException): EventOccurrence | null {
  if (!occursOn(event, date)) return null;
  let starts_at = event.starts_at;
  let ends_at = event.ends_at;
  if (event.recurrence_days?.length) {
    const startLocal = chileLocal(event.starts_at);
    const endLocal = chileLocal(event.ends_at ?? new Date(Date.parse(event.starts_at) + 3600000));
    const daySpan = Math.round((Date.parse(endLocal.slice(0, 10)) - Date.parse(startLocal.slice(0, 10))) / 86400000);
    const start = chileInstant(`${date}T${startLocal.slice(11)}`);
    const end = chileInstant(`${addDays(date, daySpan)}T${endLocal.slice(11)}`);
    // A missing DST hour is advanced by one hour for a recurring slot.
    const advance = (local: string) => chileInstant(new Date(Date.parse(`${local}:00Z`) + 3600000).toISOString().slice(0, 16));
    starts_at = start ?? advance(`${date}T${startLocal.slice(11)}`) ?? event.starts_at;
    ends_at = end ?? advance(`${addDays(date, daySpan)}T${endLocal.slice(11)}`);
    if (!ends_at || Date.parse(ends_at) <= Date.parse(starts_at)) {
      const wallDuration = Date.parse(`${endLocal}:00Z`) - Date.parse(`${startLocal}:00Z`);
      ends_at = new Date(Date.parse(starts_at) + wallDuration).toISOString();
    }
  }
  return {
    ...event, starts_at, ends_at, ...exception,
    id: event.id, occurrence_date: date, occurrence_id: `${event.id}:${date}`,
    recurring: !!event.recurrence_days?.length,
    cancelled: event.status === "cancelled" || !!exception?.cancelled,
  };
}
export function expandEvents(events: CalendarEvent[], exceptions: EventException[], first: string, last: string): EventOccurrence[] {
  const overrides = new Map(exceptions.map(item => [`${item.event_id}:${item.occurrence_date}`, item]));
  const result: EventOccurrence[] = [];
  for (const event of events) {
    for (let day = first; day <= last; day = addDays(day, 1)) {
      const occurrence = occurrenceOn(event, day, overrides.get(`${event.id}:${day}`));
      if (occurrence) result.push(occurrence);
    }
  }
  return result.sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at) || a.title.localeCompare(b.title));
}
export function occurrenceStatus(event: EventOccurrence, now: number): string {
  if (event.cancelled) return "Cancelado";
  if (event.status === "draft") return "Borrador";
  if (event.status === "completed" || (event.ends_at ? now >= Date.parse(event.ends_at) : chileDate(now) > event.occurrence_date)) return "Finalizado";
  return now >= Date.parse(event.starts_at) ? "En curso" : "Próximo";
}
export function eventTime(instant: string): string {
  return new Intl.DateTimeFormat("es-CL", { timeZone: EVENT_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(instant));
}
export function dayLabel(date: string): string {
  return new Intl.DateTimeFormat("es-CL", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00Z`));
}
