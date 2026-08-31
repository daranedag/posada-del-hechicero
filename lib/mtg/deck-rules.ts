import type { ParsedDeck } from "./deck-parser.ts";
import type { ScryfallCard } from "./scryfall.ts";
import type { TournamentFormat } from "../types.ts";

export interface ValidatedCard {
  board: "main" | "sideboard";
  quantity: number;
  card_name: string;
  scryfall_id: string;
  oracle_id: string | null;
  set_code: string;
  collector_number: string;
  type_line: string;
  legality: string;
}

export interface DeckValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  mainCount: number;
  sideboardCount: number;
  cards: ValidatedCard[];
}

function allowedCopies(typeLine: string, oracleText: string | undefined, defaultMaximum: number) {
  if (/\bBasic Land\b/i.test(typeLine)) return Number.POSITIVE_INFINITY;
  if (/A deck can have any number of cards named/i.test(oracleText ?? "")) return Number.POSITIVE_INFINITY;
  const explicit = oracleText?.match(/A deck can have up to (\w+) cards named/i)?.[1];
  const words: Record<string, number> = { seven: 7, nine: 9, twelve: 12 };
  if (explicit) return Number(explicit) || words[explicit.toLowerCase()] || defaultMaximum;
  return defaultMaximum;
}

function findCard(cards: Map<string, ScryfallCard>, requestedName: string) {
  const normalized = requestedName.toLocaleLowerCase("en");
  const exact = cards.get(normalized);
  if (exact) return exact;
  return [...cards.values()].find((card) => card.name.split(" // ").some((face) => face.toLocaleLowerCase("en") === normalized));
}

export function evaluateDeckRules(
  parsed: ParsedDeck,
  format: TournamentFormat,
  scryfallCards: Map<string, ScryfallCard>,
  notFound: string[] = [],
): DeckValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validatedCards: ValidatedCard[] = [];

  if (!parsed.cards.length) errors.push("No encontramos lineas con el formato 'cantidad nombre de carta'.");
  if (parsed.mainCount < format.min_main_cards) errors.push(`El mazo principal tiene ${parsed.mainCount} cartas; necesita al menos ${format.min_main_cards}.`);
  if (parsed.sideboardCount > format.max_sideboard_cards) errors.push(`El sideboard tiene ${parsed.sideboardCount} cartas; el maximo es ${format.max_sideboard_cards}.`);
  for (const missing of notFound) errors.push(`No encontramos la carta "${missing}" en Scryfall.`);

  const totalsByOracle = new Map<string, { name: string; quantity: number; maximum: number }>();
  for (const parsedCard of parsed.cards) {
    const card = findCard(scryfallCards, parsedCard.name);
    if (!card) continue;
    const legality = card.legalities[format.scryfall_key] ?? "not_legal";
    if (legality !== "legal") errors.push(`${card.name} figura como ${legality === "banned" ? "prohibida" : "no legal"} en ${format.label}.`);

    const oracleKey = card.oracle_id ?? card.id;
    const current = totalsByOracle.get(oracleKey) ?? { name: card.name, quantity: 0, maximum: allowedCopies(card.type_line, card.oracle_text, format.max_copies) };
    current.quantity += parsedCard.quantity;
    totalsByOracle.set(oracleKey, current);

    validatedCards.push({ board: parsedCard.board, quantity: parsedCard.quantity, card_name: card.name, scryfall_id: card.id, oracle_id: card.oracle_id ?? null, set_code: card.set, collector_number: card.collector_number, type_line: card.type_line, legality });
  }

  for (const entry of totalsByOracle.values()) {
    if (entry.quantity > entry.maximum) errors.push(`${entry.name}: ${entry.quantity} copias entre mazo y sideboard; el maximo es ${entry.maximum}.`);
  }
  if (parsed.mainCount > 250) warnings.push("El mazo principal es inusualmente grande; confirma que pegaste solo una lista.");

  return { valid: errors.length === 0, errors, warnings, mainCount: parsed.mainCount, sideboardCount: parsed.sideboardCount, cards: validatedCards };
}
