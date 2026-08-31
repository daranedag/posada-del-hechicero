import assert from "node:assert/strict";
import test from "node:test";
import { evaluateDeckRules } from "../lib/mtg/deck-rules.ts";
import type { ParsedDeckCard } from "../lib/mtg/deck-parser.ts";
import type { ScryfallCard } from "../lib/mtg/scryfall.ts";

const pioneer = { code: "pioneer", label: "Pioneer", scryfall_key: "pioneer", min_main_cards: 60, max_sideboard_cards: 15, max_copies: 4 };

function card(name: string, options: Partial<ScryfallCard> = {}): ScryfallCard {
  return {
    id: `${name}-id`, oracle_id: `${name}-oracle`, name, set: "tst", collector_number: "1", type_line: "Instant", oracle_text: "", legalities: { pioneer: "legal" }, ...options,
  };
}

function parsed(cards: ParsedDeckCard[]) {
  return {
    cards,
    mainCount: cards.filter((item) => item.board === "main").reduce((sum, item) => sum + item.quantity, 0),
    sideboardCount: cards.filter((item) => item.board === "sideboard").reduce((sum, item) => sum + item.quantity, 0),
  };
}

test("acepta tierras básicas sin límite de copias", () => {
  const forest = card("Forest", { type_line: "Basic Land — Forest" });
  const mountain = card("Mountain", { type_line: "Basic Land — Mountain" });
  const result = evaluateDeckRules(
    parsed([{ board: "main", quantity: 60, name: "Forest" }, { board: "sideboard", quantity: 15, name: "Mountain" }]),
    pioneer,
    new Map([["forest", forest], ["mountain", mountain]]),
  );
  assert.equal(result.valid, true);
  assert.equal(result.mainCount, 60);
  assert.equal(result.sideboardCount, 15);
});

test("rechaza cartas prohibidas y exceso de copias entre main y sideboard", () => {
  const forest = card("Forest", { type_line: "Basic Land — Forest" });
  const opt = card("Opt");
  const banned = card("Field of the Dead", { type_line: "Land", legalities: { pioneer: "banned" } });
  const result = evaluateDeckRules(
    parsed([{ board: "main", quantity: 56, name: "Forest" }, { board: "main", quantity: 4, name: "Opt" }, { board: "sideboard", quantity: 1, name: "Opt" }, { board: "sideboard", quantity: 1, name: "Field of the Dead" }]),
    pioneer,
    new Map([["forest", forest], ["opt", opt], ["field of the dead", banned]]),
  );
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("prohibida")));
  assert.ok(result.errors.some((error) => error.includes("5 copias")));
});

test("respeta excepciones de cantidad declaradas por la carta", () => {
  const mountain = card("Mountain", { type_line: "Basic Land — Mountain" });
  const dwarves = card("Seven Dwarves", { type_line: "Creature — Dwarf", oracle_text: "A deck can have up to seven cards named Seven Dwarves." });
  const result = evaluateDeckRules(
    parsed([{ board: "main", quantity: 53, name: "Mountain" }, { board: "main", quantity: 7, name: "Seven Dwarves" }]),
    pioneer,
    new Map([["mountain", mountain], ["seven dwarves", dwarves]]),
  );
  assert.equal(result.valid, true);
});
