import assert from "node:assert/strict";
import test from "node:test";
import { fetchCardsByName, findScryfallCard, type ScryfallCard } from "../lib/mtg/scryfall";

const island: ScryfallCard = {
  id: "island-es", oracle_id: "island-oracle", name: "Island", printed_name: "Isla", lang: "es",
  set: "tst", collector_number: "1", type_line: "Basic Land — Island", legalities: { pioneer: "legal" },
};

test("resuelve Isla como Island aunque exista una impresión errónea de Plains con ese nombre", async (context) => {
  const searches: string[] = [];
  context.mock.method(globalThis, "fetch", async (input: string | URL) => {
    if (String(input).endsWith("/collection")) return Response.json({ data: [], not_found: [{ name: "Isla" }] });
    const query = new URL(input).searchParams.get("q") ?? "";
    searches.push(query);
    const plains = { ...island, id: "plains-misprint", oracle_id: "plains-oracle", name: "Plains" };
    return Response.json({ data: query.includes('!"Island"') ? [island] : [island, plains] });
  });
  const result = await fetchCardsByName(["Isla"]);
  assert.deepEqual(result.notFound, []);
  assert.equal(findScryfallCard(result.cards, "Isla")?.name, "Island");
  assert.deepEqual(searches, ['!"Island" lang:es']);
});

test("no sustituye un nombre inexistente por una carta con nombre parecido", async (context) => {
  context.mock.method(globalThis, "fetch", async (input: string | URL) =>
    Response.json({ data: String(input).endsWith("/collection") ? [] : [island] }));
  const result = await fetchCardsByName(["Isla Inventada"]);
  assert.deepEqual(result.notFound, ["Isla Inventada"]);
  assert.equal(findScryfallCard(result.cards, "Isla Inventada"), undefined);
});

test("consulta todas las cartas en lotes de hasta 75 y elimina nombres duplicados", async (context) => {
  const batches: number[] = [];
  context.mock.method(globalThis, "fetch", async (_input: string | URL, options: RequestInit) => {
    const { identifiers } = JSON.parse(String(options.body)) as { identifiers: Array<{ name: string }> };
    batches.push(identifiers.length);
    return Response.json({ data: identifiers.map(({ name }) => ({ ...island, id: name, name, printed_name: undefined })) });
  });
  const names = Array.from({ length: 76 }, (_, index) => `Card ${index}`);
  const result = await fetchCardsByName([...names, "  CARD 0  "]);
  assert.deepEqual(batches, [75, 1]);
  assert.deepEqual(result.notFound, []);
  assert.ok(names.every(name => findScryfallCard(result.cards, name)));
});

test("un fallo de Scryfall interrumpe la validación", async (context) => {
  context.mock.method(globalThis, "fetch", async () => new Response("Unavailable", { status: 503 }));
  await assert.rejects(fetchCardsByName(["Opt"]), /Scryfall/);
});
