import "server-only";
import {
  findCardByName,
  findUniqueCardByLocalizedName,
  indexCardNames,
  normalizeCardName,
  type CardNameData,
} from "@/lib/mtg/card-name";

export interface ScryfallCard extends CardNameData {
  lang?: string;
  printed_name?: string;
  set: string;
  collector_number: string;
  type_line: string;
  oracle_text?: string;
  legalities: Record<string, "legal" | "not_legal" | "restricted" | "banned">;
}

interface ScryfallCollectionResponse {
  data: ScryfallCard[];
  not_found?: Array<{ name?: string }>;
}

interface ScryfallSearchResponse {
  data: ScryfallCard[];
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const localizedCards = new Map<string, ScryfallCard | null>();

const requestHeaders = {
  Accept: "application/json",
  "User-Agent": "PosadaDelHechiceroDeckRegistration/1.0 (Valdivia, Chile)",
};

function escapeScryfallSearchValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function fetchSpanishCardByName(name: string) {
  const normalized = normalizeCardName(name);
  const cached = localizedCards.get(normalized);
  if (cached !== undefined) return cached ?? undefined;

  const query = `!"${escapeScryfallSearchValue(name.trim())}" lang:es`;
  const url = new URL("https://api.scryfall.com/cards/search");
  url.searchParams.set("q", query);
  url.searchParams.set("unique", "cards");

  const response = await fetch(url, {
    headers: requestHeaders,
    cache: "no-store",
  });

  if (response.status === 404) {
    localizedCards.set(normalized, null);
    return undefined;
  }
  if (!response.ok) throw new Error("Scryfall no esta disponible en este momento. Intenta nuevamente.");

  const payload = (await response.json()) as ScryfallSearchResponse;
  const card = findUniqueCardByLocalizedName(payload.data, name);
  localizedCards.set(normalized, card ?? null);
  return card;
}

export async function fetchCardsByName(names: string[]) {
  const uniqueNamesByKey = new Map<string, string>();
  for (const name of names) {
    const trimmed = name.trim();
    if (trimmed) uniqueNamesByKey.set(normalizeCardName(trimmed), trimmed);
  }
  const uniqueNames = [...uniqueNamesByKey.values()];
  const cards = new Map<string, ScryfallCard>();

  for (let index = 0; index < uniqueNames.length; index += 75) {
    if (index > 0) await wait(120);
    const batch = uniqueNames.slice(index, index + 75);
    const response = await fetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: {
        ...requestHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifiers: batch.map((name) => ({ name })) }),
      cache: "no-store",
    });

    if (!response.ok) throw new Error("Scryfall no esta disponible en este momento. Intenta nuevamente.");
    const payload = (await response.json()) as ScryfallCollectionResponse;
    for (const card of payload.data) indexCardNames(cards, card);
  }

  const unresolved = uniqueNames.filter((name) => !findCardByName(cards, name));
  const notFound: string[] = [];
  for (const name of unresolved) {
    await wait(120);
    const card = await fetchSpanishCardByName(name);
    if (!card) {
      notFound.push(name);
      continue;
    }
    indexCardNames(cards, card);
    cards.set(normalizeCardName(name), card);
  }

  return { cards, notFound };
}

export function findScryfallCard(cards: Map<string, ScryfallCard>, requestedName: string) {
  return findCardByName(cards, requestedName);
}
