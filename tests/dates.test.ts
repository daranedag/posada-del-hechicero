import assert from "node:assert/strict";
import test from "node:test";
import { formatChileDate, formatChileDateTimeInput, parseDayFirstDateTime } from "../lib/dates.ts";
import { chileInstant } from "../lib/events/calendar.ts";

test("formatea una fecha ISO para un campo local de Chile", () => {
  assert.equal(formatChileDateTimeInput("2026-09-09T18:30:00.000Z"), "2026-09-09T15:30");
});

test("muestra día antes del mes incluso en fechas ambiguas", () => {
  assert.equal(formatChileDate("2026-09-05T18:30:00.000Z"), "05/09/2026 02:30 PM");
  assert.equal(parseDayFirstDateTime("05/09/2026", "14:30"), "2026-09-05T14:30");
  assert.equal(parseDayFirstDateTime("29/09/2026", "00:00"), "2026-09-29T00:00");
});

test("valida fechas reales y horas de 24 horas", () => {
  assert.equal(parseDayFirstDateTime("29/02/2028", "23:59"), "2028-02-29T23:59");
  for (const date of ["29/02/2026", "31/04/2026", "09/29/2026", "00/09/2026", "2026-09-29", "", null]) {
    assert.equal(parseDayFirstDateTime(date, "18:00"), null);
  }
  for (const time of ["24:00", "12:60", "6:30 PM", "", null]) {
    assert.equal(parseDayFirstDateTime("29/09/2026", time), null);
  }
});

test("conserva la hora chilena al guardar y volver a editar en verano e invierno", () => {
  for (const [date, expected] of [["29/09/2026", "2026-09-29T21:30:00.000Z"], ["29/06/2026", "2026-06-29T22:30:00.000Z"]]) {
    const local = parseDayFirstDateTime(date, "18:30")!;
    const instant = chileInstant(local)!;
    assert.equal(instant, expected);
    assert.equal(formatChileDateTimeInput(instant), local);
  }
  assert.equal(chileInstant(parseDayFirstDateTime("06/09/2026", "00:30")!), null);
});
