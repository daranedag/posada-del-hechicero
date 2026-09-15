import assert from "node:assert/strict";
import test from "node:test";
import { chileInstant, chileLocal, expandEvents, occurrenceOn, occurrenceStatus, monthRange, isDate, type CalendarEvent, type EventException } from "../lib/events/calendar.ts";
import { eventInputSchema } from "../lib/events/validation.ts";

const weekly: CalendarEvent = {
  id: "event-1", slug: "commander", title: "Commander", description: "Viernes de juego", event_type: "magic", format_label: "Commander",
  starts_at: "2026-09-04T22:00:00.000Z", ends_at: "2026-09-05T02:00:00.000Z", location: "La Posada", image_url: null, image_key: null,
  status: "published", recurrence_days: [5], recurrence_until: null, updated_at: "2026-09-01T12:00:00Z",
};
test("weekly events retain local hours across Chile DST", () => {
  const events = expandEvents([weekly], [], "2026-09-01", "2026-09-30");
  assert.equal(events.length, 4);
  assert.deepEqual(events.map(event => chileLocal(event.starts_at).slice(11)), ["18:00", "18:00", "18:00", "18:00"]);
  assert.equal(events[0].starts_at, "2026-09-04T22:00:00.000Z");
  assert.equal(events[1].starts_at, "2026-09-11T21:00:00.000Z");
});
test("weekly range is inclusive and can select multiple weekdays", () => {
  const events = expandEvents([{ ...weekly, recurrence_days: [2, 5], recurrence_until: "2026-09-11" }], [], "2026-09-01", "2026-09-30");
  assert.deepEqual(events.map(event => event.occurrence_date), ["2026-09-04", "2026-09-08", "2026-09-11"]);
});
test("one cancelled date does not cancel other weeks or special events", () => {
  const exception: EventException = { ...weekly, event_id: weekly.id, occurrence_date: "2026-09-11", starts_at: "2026-09-11T21:00:00Z", ends_at: "2026-09-12T01:00:00Z", cancelled: true };
  const special = { ...weekly, id: "special", recurrence_days: null, starts_at: "2026-09-11T22:00:00Z", ends_at: "2026-09-12T00:00:00Z" };
  const events = expandEvents([weekly, special], [exception], "2026-09-01", "2026-09-30");
  assert.equal(events.length, 5);
  assert.equal(events.filter(event => event.cancelled).length, 1);
  assert.equal(events.find(event => event.id === "special")?.cancelled, false);
});
test("exceptions replace details and hours only for their own date", () => {
  const exception: EventException = { ...weekly, event_id: weekly.id, occurrence_date: "2026-09-11", title: "Commander especial", starts_at: "2026-09-11T23:00:00Z", ends_at: "2026-09-12T01:00:00Z", cancelled: false };
  const events = expandEvents([weekly], [exception], "2026-09-01", "2026-09-30");
  assert.equal(events[1].title, "Commander especial"); assert.equal(events[2].title, "Commander");
});
test("today status changes at exact start and end boundaries", () => {
  const event = occurrenceOn(weekly, "2026-09-11")!;
  assert.equal(occurrenceStatus(event, Date.parse(event.starts_at) - 1), "Próximo");
  assert.equal(occurrenceStatus(event, Date.parse(event.starts_at)), "En curso");
  assert.equal(occurrenceStatus(event, Date.parse(event.ends_at!)), "Finalizado");
});
test("calendar handles leap years, year boundaries and invalid dates", () => {
  assert.deepEqual(monthRange("2028-02"), { first: "2028-02-01", last: "2028-02-29" });
  assert.deepEqual(monthRange("2026-12"), { first: "2026-12-01", last: "2026-12-31" });
  assert.equal(isDate("2026-02-30"), false); assert.equal(isDate("2026-13-01"), false);
});
test("missing DST hour is rejected for forms and advanced for a recurring slot", () => {
  assert.equal(chileInstant("2026-09-06T00:30"), null);
  const sunday = { ...weekly, starts_at: "2026-08-30T04:30:00Z", ends_at: "2026-08-30T06:30:00Z", recurrence_days: [0] };
  const event = occurrenceOn(sunday, "2026-09-06")!;
  assert.equal(chileLocal(event.starts_at), "2026-09-06T01:30");
});
test("overnight recurrence ends on the next local date", () => {
  const event = occurrenceOn({ ...weekly, ends_at: "2026-09-05T05:00:00Z" }, "2026-09-11")!;
  assert.equal(chileLocal(event.ends_at!), "2026-09-12T01:00");
});
test("form rejects inverted times and weekly rules without selected days", () => {
  const input = { title: "Evento", description: "", event_type: "community", format_label: "", location: "Local", date: "2026-09-15", end_date: "2026-09-15", start_time: "18:00", end_time: "17:00", repetition: "weekly", days: [], until: "", status: "published" };
  const result = eventInputSchema.safeParse(input);
  assert.equal(result.success, false);
  if (!result.success) { const errors = result.error.flatten().fieldErrors; assert.ok(errors.end_time); assert.ok(errors.days); }
});
test("a short recurrence crossing a missing DST hour still has a positive duration", () => {
  const event = occurrenceOn({ ...weekly, starts_at: "2026-08-30T04:30:00Z", ends_at: "2026-08-30T05:00:00Z", recurrence_days: [0] }, "2026-09-06")!;
  assert.equal(Date.parse(event.ends_at!) - Date.parse(event.starts_at), 30 * 60000);
});
test("legacy events without an end time remain in progress on their local date", () => {
  const event = occurrenceOn({ ...weekly, recurrence_days: null, ends_at: null }, "2026-09-04")!;
  assert.equal(occurrenceStatus(event, Date.parse("2026-09-05T01:00:00Z")), "En curso");
  assert.equal(occurrenceStatus(event, Date.parse("2026-09-05T05:00:00Z")), "Finalizado");
});
test("a recurrence range must contain at least one selected weekday", () => {
  const result = eventInputSchema.safeParse({ title: "Evento", description: "", event_type: "community", format_label: "", location: "Local", date: "2026-09-15", end_date: "2026-09-15", start_time: "18:00", end_time: "20:00", repetition: "weekly", days: [5], until: "2026-09-16", status: "published" });
  assert.equal(result.success, false);
});
