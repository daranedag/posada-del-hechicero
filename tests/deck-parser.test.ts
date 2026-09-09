import assert from "node:assert/strict";
import test from "node:test";
import { parseDeckList } from "../lib/mtg/deck-parser.ts";

test("interpreta exportaciones de Moxfield y separa el sideboard", () => {
  const result = parseDeckList(`Deck
4 Consider (MID) 44
4 Consider
52 Island (FDN) 275

Sideboard
3 Negate (MOM) 68
12 Mountain`);

  assert.equal(result.mainCount, 60);
  assert.equal(result.sideboardCount, 15);
  assert.deepEqual(result.cards.find((card) => card.name === "Consider"), { board: "main", quantity: 8, name: "Consider" });
});

test("interpreta prefijos de MTGO/MTGTop8 y cantidades con x de ManaBox", () => {
  const result = parseDeckList(`60x Forest
SB: 4x Duress
SB: 11 Swamp`);

  assert.equal(result.mainCount, 60);
  assert.equal(result.sideboardCount, 15);
  assert.equal(result.cards.length, 3);
});

test("conserva nombres de cartas de doble cara", () => {
  const result = parseDeckList("4 Fire // Ice\n56 Island");
  assert.equal(result.cards[0].name, "Fire // Ice");
});

test("reconoce encabezados de mazo y banquillo en español", () => {
  const result = parseDeckList(`Mazo
60 Bosque

Banquillo
15 Montaña`);

  assert.equal(result.mainCount, 60);
  assert.equal(result.sideboardCount, 15);
  assert.deepEqual(result.cards[1], { board: "sideboard", quantity: 15, name: "Montaña" });
});

test("conserva las líneas de origen de cada carta para señalar errores", () => {
  const result = parseDeckList(`Deck
4 Consider
4 Carta Inventada (TST) 12

Sideboard
2 Carta Inventada`);

  assert.deepEqual(result.cardLines, [
    { lineNumber: 2, name: "Consider" },
    { lineNumber: 3, name: "Carta Inventada" },
    { lineNumber: 6, name: "Carta Inventada" },
  ]);
});
