import assert from "node:assert/strict";
import test from "node:test";
import {
  findCardByName,
  findUniqueCardByLocalizedName,
  indexCardNames,
  normalizeCardName,
} from "../lib/mtg/card-name.ts";

const lightningBolt = {
  id: "lightning-bolt-es",
  oracle_id: "lightning-bolt-oracle",
  name: "Lightning Bolt",
  printed_name: "Relámpago",
};

test("normaliza mayúsculas, espacios y acentos en los nombres", () => {
  assert.equal(normalizeCardName("  RELÁMPAGO  "), "relampago");
});

test("encuentra una carta por su nombre inglés o español", () => {
  const cards = new Map();
  indexCardNames(cards, lightningBolt);

  assert.equal(findCardByName(cards, "Lightning Bolt"), lightningBolt);
  assert.equal(findCardByName(cards, "Relampago"), lightningBolt);
});

test("resuelve nombres impresos de cartas de varias caras", () => {
  const fireIce = {
    id: "fire-ice-es",
    oracle_id: "fire-ice-oracle",
    name: "Fire // Ice",
    card_faces: [
      { name: "Fire", printed_name: "Fuego" },
      { name: "Ice", printed_name: "Hielo" },
    ],
  };

  assert.equal(findUniqueCardByLocalizedName([fireIce], "Fuego // Hielo"), fireIce);
  assert.equal(findUniqueCardByLocalizedName([fireIce], "Fuego"), fireIce);
});

test("no elige automáticamente un nombre localizado ambiguo", () => {
  const duplicate = { ...lightningBolt, id: "otra", oracle_id: "otro-oracle" };
  assert.equal(findUniqueCardByLocalizedName([lightningBolt, duplicate], "Relámpago"), undefined);
});
