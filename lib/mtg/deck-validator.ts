import "server-only";
import { parseDeckList } from "@/lib/mtg/deck-parser";
import { evaluateDeckRules, type DeckValidationResult } from "@/lib/mtg/deck-rules";
import { fetchCardsByName } from "@/lib/mtg/scryfall";
import type { TournamentFormat } from "@/lib/types";

export async function validateDeckList(raw: string, format: TournamentFormat): Promise<DeckValidationResult> {
  const parsed = parseDeckList(raw);
  if (!parsed.cards.length) return evaluateDeckRules(parsed, format, new Map());

  const { cards: scryfallCards, notFound } = await fetchCardsByName(parsed.cards.map((card) => card.name));
  return evaluateDeckRules(parsed, format, scryfallCards, notFound);
}
