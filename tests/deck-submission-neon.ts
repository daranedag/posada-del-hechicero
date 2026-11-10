// Run explicitly against the isolated migration branch:
// pnpm exec node --conditions=react-server --import tsx --env-file=.env.neon-migration.local tests/deck-submission-neon.ts
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { POST } from "../app/api/tournaments/[code]/submit/route";
import { queryDatabase } from "../lib/db/server";
import { publicDb } from "../lib/db/public";

const code = `T${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
const ownerId = randomUUID();
const tournamentId = randomUUID();
const baseInput = {
  firstName: "  María José  ", lastName: "  Muñoz  ", email: "",
  archetype: "  Mono Blue  ", source: "plain-text",
  deckList: "Deck\n56 Island\n4 Opt\n\nSideboard\n2 Negate\n13 Mountain",
};
let editToken: string;
let failures = 0;
let passed = 0;

async function check(label: string, run: () => Promise<void>) {
  try { await run(); passed++; console.log(`PASS ${label}`); }
  catch (error) {
    failures++;
    // Assertions contain only fixture data, never connection strings or tokens.
    console.error(`FAIL ${label}: ${error instanceof Error ? error.message : "Unexpected error"}`);
  }
}

async function submit(input: Record<string, unknown> = {}, tournamentCode = code) {
  const response = await POST(new Request(`http://localhost/api/tournaments/${tournamentCode}/submit`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...baseInput, ...input }),
  }), { params: Promise.resolve({ code: tournamentCode }) });
  return { status: response.status, body: await response.json() };
}

async function snapshot() {
  const { rows } = await queryDatabase("admin", `SELECT
    (SELECT count(*)::int FROM pdh_players WHERE tournament_id=$1) AS players,
    (SELECT count(*)::int FROM pdh_deck_submissions WHERE tournament_id=$1) AS submissions,
    (SELECT count(*)::int FROM pdh_deck_cards c JOIN pdh_deck_submissions s ON s.id=c.submission_id WHERE s.tournament_id=$1) AS cards`, [tournamentId]);
  return rows[0];
}

async function rejectWithoutSaving(input: Record<string, unknown>, status: number, message?: RegExp) {
  const before = await snapshot();
  const result = await submit(input);
  assert.equal(result.status, status, JSON.stringify({ error: result.body.error, validation: result.body.validation }));
  if (message) assert.match(JSON.stringify(result.body), message);
  assert.deepEqual(await snapshot(), before, "Rejected submissions must not write players, decks or cards");
  return result.body;
}

async function main() {
  assert.match(process.env.NEON_BRANCH ?? "", /^migration-/, "Fixtures must run on a migration branch");
  assert.equal(process.env.NEON_BRANCH_ID, "br-hidden-dust-b6i1717k", "Use the verified test branch, never production");
  await queryDatabase("admin", "INSERT INTO pdh_users(id,email) VALUES($1,$2)", [ownerId, `${ownerId}@example.invalid`]);
  try {
    await queryDatabase("admin", `INSERT INTO pdh_tournaments(id,owner_id,code,name,format_code,starts_at,submission_deadline,status)
      VALUES($1,$2,$3,'Deck registration verification','pioneer',now()+interval '2 days',now()+interval '1 day','open')`, [tournamentId, ownerId, code]);

    for (const [label, input] of [
      ["empty first name", { firstName: "   " }],
      ["empty last name", { lastName: "" }],
      ["invalid email", { email: "incorrecto" }],
      ["empty deck name", { archetype: "   " }],
      ["multiline deck name", { archetype: "Mono\nBlue" }],
    ] as const) await check(label, async () => { await rejectWithoutSaving(input, 400); });

    await check("unknown tournament", async () => { assert.equal((await submit({}, "NOEXISTE00")).status, 404); });

    await check("English names: validates and stores every card in Neon", async () => {
      const result = await submit();
      assert.equal(result.status, 200, JSON.stringify(result.body));
      editToken = result.body.editToken;
      assert.equal(result.body.version, 1);
      assert.equal(result.body.validation.mainCount, 60);
      assert.equal(result.body.validation.sideboardCount, 15);
      const player = (await queryDatabase("admin", "SELECT first_name,last_name,email,token_hash FROM pdh_players WHERE tournament_id=$1", [tournamentId])).rows[0];
      assert.equal(player.first_name, "María José");
      assert.equal(player.last_name, "Muñoz");
      assert.equal(player.email, null);
      assert.equal(player.token_hash, createHash("sha256").update(editToken).digest("hex"));
      const submission = (await queryDatabase("admin", "SELECT * FROM pdh_deck_submissions WHERE tournament_id=$1", [tournamentId])).rows[0];
      assert.equal(submission.archetype, "Mono Blue");
      assert.equal(submission.validation_status, "valid");
      assert.equal((submission.validation_summary as { provider: string }).provider, "Scryfall");
      const cards = (await queryDatabase("admin", "SELECT * FROM pdh_deck_cards WHERE submission_id=$1 ORDER BY board,card_name", [submission.id])).rows;
      assert.deepEqual(cards.map(c => [c.board, c.card_name, c.quantity]), [
        ["main", "Island", 56], ["main", "Opt", 4], ["sideboard", "Mountain", 13], ["sideboard", "Negate", 2],
      ]);
      assert.ok(cards.every(c => c.legality === "legal" && c.scryfall_id && c.oracle_id && c.set_code && c.collector_number && c.type_line));
    });

    await check("Spanish names and editing: canonical names and version history", async () => {
      assert.ok(editToken, "Initial registration must succeed");
      const result = await submit({ editToken, firstName: "  José  ", archetype: "Control azul", deckList: "Mazo\n56 Isla\n2 Opt\n2 Optar\n\nBanquillo\n2 Negar\n13 Montaña" });
      assert.equal(result.status, 200, JSON.stringify(result.body));
      assert.equal(result.body.version, 2);
      assert.equal(result.body.editToken === editToken, true);
      const versions = (await queryDatabase("admin", "SELECT id,version_number,is_current,archetype FROM pdh_deck_submissions WHERE tournament_id=$1 ORDER BY version_number", [tournamentId])).rows;
      assert.deepEqual(versions.map(v => [v.version_number, v.is_current]), [[1, false], [2, true]]);
      assert.equal(versions[1].archetype, "Control azul");
      const cards = (await queryDatabase("admin", "SELECT card_name,quantity FROM pdh_deck_cards WHERE submission_id=$1", [versions[1].id])).rows;
      assert.deepEqual([...new Set(cards.map(c => c.card_name))].sort(), ["Island", "Mountain", "Negate", "Opt"]);
      assert.equal(cards.filter(c => c.card_name === "Opt").reduce((sum, c) => sum + Number(c.quantity), 0), 4);
      assert.equal((await snapshot()).players, 1);
    });

    await check("unknown card: rejects and identifies exact source lines", async () => {
      const body = await rejectWithoutSaving({ deckList: "Deck\n56 Island\n4 Carta Inventada Posada\nSideboard\n1 Carta Inventada Posada" }, 422, /Carta Inventada Posada/);
      assert.deepEqual(body.validation.notFoundCards, [{ name: "Carta Inventada Posada", lineNumbers: [3, 5] }]);
    });
    await check("misspelled card name", async () => { await rejectWithoutSaving({ deckList: "Deck\n56 Island\n4 Optttt" }, 422, /Optttt/); });
    await check("banned card for the tournament format", async () => { await rejectWithoutSaving({ deckList: "Deck\n56 Island\n4 Field of the Dead" }, 422, /prohibida/); });
    await check("nonlegal card for the tournament format", async () => { await rejectWithoutSaving({ deckList: "Deck\n56 Island\n4 Counterspell" }, 422, /no legal/); });
    await check("copy limit across main and sideboard", async () => { await rejectWithoutSaving({ deckList: "Deck\n56 Island\n4 Opt\nSideboard\n1 Opt" }, 422, /5 copias/); });
    await check("copy limit across English and Spanish aliases", async () => { await rejectWithoutSaving({ deckList: "Deck\n55 Island\n3 Opt\n2 Optar" }, 422, /5 copias/); });
    await check("minimum main deck size", async () => { await rejectWithoutSaving({ deckList: "Deck\n55 Island\n4 Opt" }, 422, /necesita al menos 60/); });
    await check("maximum sideboard size", async () => { await rejectWithoutSaving({ deckList: "Deck\n56 Island\n4 Opt\nSideboard\n16 Island" }, 422, /maximo es 15/); });
    await check("private edit token required", async () => { await rejectWithoutSaving({ editToken: "invalid-fixture-token" }, 403); });
    await check("Scryfall outage rejects without saving", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => new Response("Unavailable", { status: 503 });
      try { await rejectWithoutSaving({}, 503, /Scryfall/); }
      finally { globalThis.fetch = originalFetch; }
    });
    await check("player and card details are private under RLS", async () => {
      for (const table of ["pdh_players", "pdh_deck_submissions"]) {
        const result = await publicDb.from(table).select("id").eq("tournament_id", tournamentId);
        assert.equal(result.error, null);
        assert.deepEqual(result.data, []);
      }
      const result = await publicDb.from("pdh_deck_cards").select("id");
      assert.equal(result.error, null);
      assert.deepEqual(result.data, []);
    });
    await check("closed tournament", async () => {
      await queryDatabase("admin", "UPDATE pdh_tournaments SET status='locked' WHERE id=$1", [tournamentId]);
      try { await rejectWithoutSaving({}, 409); }
      finally { await queryDatabase("admin", "UPDATE pdh_tournaments SET status='open' WHERE id=$1", [tournamentId]); }
    });
    await check("submission deadline", async () => {
      await queryDatabase("admin", "UPDATE pdh_tournaments SET submission_deadline=now()-interval '1 minute' WHERE id=$1", [tournamentId]);
      try { await rejectWithoutSaving({}, 409); }
      finally { await queryDatabase("admin", "UPDATE pdh_tournaments SET submission_deadline=now()+interval '1 day' WHERE id=$1", [tournamentId]); }
    });

    // These cases verify that every pasted card line is accounted for.
    await check("card without quantity is not silently discarded", async () => { await rejectWithoutSaving({ deckList: "Deck\n56 Island\n4 Opt\nCarta Inventada sin cantidad" }, 422); });
    await check("zero quantity is not silently discarded", async () => { await rejectWithoutSaving({ deckList: "Deck\n56 Island\n4 Opt\n0 Carta Inventada" }, 422); });
  } finally {
    await queryDatabase("admin", "DELETE FROM pdh_tournaments WHERE id=$1", [tournamentId]);
    await queryDatabase("admin", "DELETE FROM pdh_users WHERE id=$1", [ownerId]);
    assert.deepEqual(await snapshot(), { players: 0, submissions: 0, cards: 0 }, "All fixtures must be removed");
  }
  console.log(`Deck submission integration: ${passed} passed, ${failures} failed. Fixtures removed.`);
  assert.equal(failures, 0, "Deck submission verification found failures");
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : "Verification failed");
  process.exitCode = 1;
}).finally(async () => {
  await (globalThis as typeof globalThis & { pdhPool?: Pool }).pdhPool?.end();
});
