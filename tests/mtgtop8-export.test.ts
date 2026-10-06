import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import { buildMtgtop8Zip } from "../lib/mtg/mtgtop8-export.ts";

test("genera el paquete MTGTop8 con evento, standings y sideboard", async () => {
  const bytes = await buildMtgtop8Zip({
    tournament: { name: "Prueba Pioneer", format_code: "pioneer", starts_at: "2026-09-02T16:00:00Z", location: "Valdivia" },
    players: [{ id: "player-1", first_name: "Álvaro", last_name: "Muñoz", email: "alvaro@example.com" }],
    submissions: [{ id: "submission-1", player_id: "player-1", version_number: 2, archetype: 'Azorius "Control", Midrange' }],
    standings: [{ player_id: "player-1", rank: 1, match_points: 9, wins: 3, losses: 0, draws: 0 }],
    cards: [
      { submission_id: "submission-1", board: "main", quantity: 60, card_name: "Island" },
      { submission_id: "submission-1", board: "sideboard", quantity: 15, card_name: "Swamp" },
    ],
  });

  const zip = await JSZip.loadAsync(bytes);
  assert.ok(zip.file("evento-mtgtop8.txt"));
  assert.ok(zip.file("standings.csv"));
  assert.ok(zip.file("decks/01-Alvaro-Munoz.txt"));

  const event = await zip.file("evento-mtgtop8.txt")!.async("string");
  const standings = await zip.file("standings.csv")!.async("string");
  const deck = await zip.file("decks/01-Alvaro-Munoz.txt")!.async("string");
  assert.match(event, /Format: pioneer/);
  assert.match(standings, /"1","Álvaro Muñoz"/);
  assert.match(standings, /"Draws","Archetype"/);
  assert.match(standings, /"Azorius ""Control"", Midrange"/);
  assert.match(deck, /\/\/ Archetype: Azorius "Control", Midrange/);
  assert.match(deck, /\/\/ Deck version: 2/);
  assert.match(deck, /60 Island/);
  assert.match(deck, /SB: 15 Swamp/);
});

test("exporta listas anteriores sin arquetipo y jugadores sin clasificación", async () => {
  const bytes = await buildMtgtop8Zip({
    tournament: { name: "Prueba", format_code: "modern", starts_at: "2026-10-06T16:00:00Z", location: "Valdivia" },
    players: [{ id: "player-1", first_name: "Ana", last_name: "Soto", email: null }],
    submissions: [{ id: "submission-1", player_id: "player-1", version_number: 1, archetype: null }],
    standings: [],
    cards: [{ submission_id: "submission-1", board: "main", quantity: 60, card_name: "Island" }],
  });
  const zip = await JSZip.loadAsync(bytes);
  const deck = await zip.file("decks/00-Ana-Soto.txt")!.async("string");
  assert.match(deck, /\/\/ Archetype: \n/);
  assert.doesNotMatch(deck, /null|undefined/);
  assert.match(deck, /60 Island/);
});
