import assert from "node:assert/strict";
import test from "node:test";
import { formatChileDateTimeInput } from "../lib/dates.ts";

test("formatea una fecha ISO para un campo local de Chile", () => {
  assert.equal(formatChileDateTimeInput("2026-09-09T18:30:00.000Z"), "2026-09-09T15:30");
});
