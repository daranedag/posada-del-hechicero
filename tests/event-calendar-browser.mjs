// Runs against a local dev server and Chrome. Fixtures exist only in a temporary
// local route, are removed in finally, and never submit data to the backend.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile, rm, access } from "node:fs/promises";
const base = process.env.CALENDAR_TEST_URL ?? "http://127.0.0.1:3100";
const fixtureDir = "app/calendar-verification";
try { await access(fixtureDir); throw new Error("Temporary fixture route already exists"); } catch (error) { if (error.code !== "ENOENT") throw error; }
await mkdir(fixtureDir);
await writeFile(`${fixtureDir}/page.tsx`, `
import { EventCalendar } from "@/components/events/event-calendar";
import { EventForm } from "@/components/events/event-form";
import { expandEvents, occurrenceOn, type CalendarEvent } from "@/lib/events/calendar";
const event: CalendarEvent = { id: "11111111-1111-4111-8111-111111111111", slug: "fixture", title: "Viernes de Commander", description: "Trae tu mazo y comparte una tarde de juego en la Posada.", event_type: "magic", format_label: "Commander casual", starts_at: "2026-09-04T22:00:00Z", ends_at: "2026-09-05T02:00:00Z", location: "Aníbal Pinto 1843, Valdivia", image_url: null, image_key: null, status: "published", recurrence_days: [5], recurrence_until: null, updated_at: "2026-09-01T12:00:00Z" };
const special = { ...event, id: "22222222-2222-4222-8222-222222222222", title: "Noche de juegos de mesa", event_type: "board-game" as const, recurrence_days: null, starts_at: "2026-09-15T21:00:00Z", ends_at: "2026-09-16T01:00:00Z" };
const exception = { ...event, event_id: event.id, occurrence_date: "2026-09-11", starts_at: "2026-09-11T21:00:00Z", ends_at: "2026-09-12T01:00:00Z", cancelled: true };
export default async function Fixture({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
 const { view } = await searchParams;
 return <main className="pdh-container py-10">{view === "form" ? <EventForm event={event} occurrence={occurrenceOn(event, "2026-09-18")!} date="2026-09-18" /> : <EventCalendar month="2026-09" events={expandEvents([event, special], [exception], "2026-09-01", "2026-09-30")} initialNow={Date.parse("2026-09-15T20:00:00Z")} admin={view === "admin"} />}</main>;
}
`);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9331", "--user-data-dir=/tmp/pdh-calendar-chrome", "--no-first-run", "--no-default-browser-check", "about:blank"], { stdio: "ignore" });
let socket;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  let targets;
  for (let i = 0; i < 50; i++) { try { targets = await (await fetch("http://127.0.0.1:9331/json")).json(); if (targets.length) break; } catch {} await delay(200); }
  assert.ok(targets?.length, "Chrome did not start");
  socket = new WebSocket(targets.find(target => target.type === "page").webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener("open", resolve, { once: true }));
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener("message", event => { const response = JSON.parse(event.data); if (response.id) { const callback = pending.get(response.id); if (callback) { pending.delete(response.id); if (response.error) callback.reject(response.error); else callback.resolve(response.result); } } });
  const call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => { const value = await call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); if (value.exceptionDetails) throw new Error(value.exceptionDetails.text); return value.result.value; };
  async function waitFor(expression) { for (let i = 0; i < 150; i++) { if (await evaluate(expression)) return; await delay(200); } throw new Error(`Timed out: ${expression}`); }
  async function navigate(path, ready) { await call("Page.navigate", { url: `${base}${path}` }); await waitFor(ready); await delay(400); }
  async function screenshot(name) { const { data } = await call("Page.captureScreenshot", { format: "png" }); await writeFile(`/tmp/${name}.png`, Buffer.from(data, "base64")); }
  await call("Page.enable"); await call("Runtime.enable");
  await call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await navigate("/eventos?mes=2026-09", "document.body.innerText.includes('septiembre de 2026')");
  assert.equal(await evaluate("document.body.innerText.includes('No pudimos cargar')"), false, "Live backend calendar query failed");
  await screenshot("pdh-calendar-live");
  await navigate("/calendar-verification", "document.body.innerText.includes('Noche de juegos de mesa')");
  assert.equal(await evaluate("document.querySelectorAll('button[aria-current=date]').length"), 1);
  await screenshot("pdh-calendar-desktop");
  await evaluate("document.querySelector('button[aria-label*=\"11 de septiembre\"]').click()");
  await waitFor("document.querySelector('#selected-day-title').textContent.includes('11 de septiembre') && document.body.innerText.includes('Cancelado')");
  assert.equal(await evaluate("[...document.querySelectorAll('button')].some(button => button.textContent.includes('Consultar por Instagram'))"), false);
  await evaluate("document.querySelector('button[aria-label*=\"18 de septiembre\"]').click()");
  await waitFor("document.querySelector('#selected-day-title').textContent.includes('18 de septiembre')");
  await evaluate("window.open = url => { window.testInstagramUrl = url; return null; }; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('blocked')) } }); [...document.querySelectorAll('button')].find(button => button.textContent.includes('Consultar por Instagram')).click()");
  await waitFor("document.body.innerText.includes('Copia el mensaje de abajo')");
  assert.match(await evaluate("window.testInstagramUrl"), /^https:\/\/ig.me\/m\//);
  assert.match(await evaluate("document.querySelector('textarea[aria-label=\"Mensaje para Instagram\"]').value"), /18 de septiembre.*18:00/);
  await call("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate("window.scrollTo(0, 0)"); await delay(200);
  assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true, "Mobile calendar overflows");
  await screenshot("pdh-calendar-mobile");
  await navigate("/calendar-verification?view=form", "!!document.querySelector('#edit-scope')");
  assert.equal(await evaluate("!!document.querySelector('select[name=repetition]')"), false);
  await evaluate("const scope = document.querySelector('#edit-scope'); scope.value = 'future'; scope.dispatchEvent(new Event('change', { bubbles: true }));");
  await waitFor("!!document.querySelector('select[name=repetition]')");
  assert.equal(await evaluate("document.querySelectorAll('input[name=days]').length"), 7);
  await evaluate("const state = document.querySelector('select[name=status]'); state.value = 'cancelled'; state.dispatchEvent(new Event('change', { bubbles: true }));");
  await waitFor("document.body.innerText.includes('Se cancelará esta fecha y toda la programación posterior')");
  assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true, "Mobile form overflows");
  await navigate("/admin/eventos", "location.pathname === '/admin/login'");
  console.log("Browser checks passed: live month loading, today, cancellation, per-day details, Instagram fallback, mobile layout, recurrence editor and admin access guard.");
} finally {
  socket?.close(); chrome.kill(); await rm(fixtureDir, { recursive: true, force: true });
}
