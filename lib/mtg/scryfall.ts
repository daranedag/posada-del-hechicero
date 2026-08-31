import "server-only";

export interface ScryfallCard {
  id: string;
  oracle_id?: string;
  name: string;
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

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function fetchCardsByName(names: string[]) {
  const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  const cards = new Map<string, ScryfallCard>();
  const notFound = new Set<string>();

  for (let index = 0; index < uniqueNames.length; index += 75) {
    if (index > 0) await wait(120);
    const batch = uniqueNames.slice(index, index + 75);
    const response = await fetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "PosadaDelHechiceroDeckRegistration/1.0 (Valdivia, Chile)",
      },
      body: JSON.stringify({ identifiers: batch.map((name) => ({ name })) }),
      cache: "no-store",
    });

    if (!response.ok) throw new Error("Scryfall no esta disponible en este momento. Intenta nuevamente.");
    const payload = (await response.json()) as ScryfallCollectionResponse;
    for (const card of payload.data) cards.set(card.name.toLocaleLowerCase("en"), card);
    for (const missing of payload.not_found ?? []) if (missing.name) notFound.add(missing.name);
  }

  return { cards, notFound: [...notFound] };
}

export function findScryfallCard(cards: Map<string, ScryfallCard>, requestedName: string) {
  const normalized = requestedName.toLocaleLowerCase("en");
  const exact = cards.get(normalized);
  if (exact) return exact;
  return [...cards.values()].find((card) =>
    card.name.split(" // ").some((face) => face.toLocaleLowerCase("en") === normalized),
  );
}
