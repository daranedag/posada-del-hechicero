export type DeckBoard = "main" | "sideboard";

export interface ParsedDeckCard {
  board: DeckBoard;
  quantity: number;
  name: string;
}

export interface ParsedDeck {
  cards: ParsedDeckCard[];
  mainCount: number;
  sideboardCount: number;
}

const sideboardHeaders = /^(sideboard|side board|side|companion|companions)$/i;
const mainHeaders = /^(deck|mainboard|main board|main deck|maindeck|main)$/i;
const categoryHeader = /^(creatures?|lands?|spells?|instants?|sorceries|enchantments?|artifacts?|planeswalkers?|battles?|other)(\s*\(\d+\))?:?$/i;

function cleanCardName(rawName: string) {
  return rawName
    .replace(/\s+\([A-Z0-9]{2,8}\)\s+[A-Za-z0-9-]+(?:\s+\*[^*]+\*)?\s*$/i, "")
    .replace(/\s+\[[A-Z0-9]{2,8}\](?:\s+[A-Za-z0-9-]+)?\s*$/i, "")
    .replace(/\s+\*[^*]+\*\s*$/, "")
    .trim();
}

export function parseDeckList(raw: string): ParsedDeck {
  let currentBoard: DeckBoard = "main";
  const aggregated = new Map<string, ParsedDeckCard>();

  for (const originalLine of raw.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    let line = originalLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("// ")) continue;

    if (sideboardHeaders.test(line.replace(/:$/, ""))) {
      currentBoard = "sideboard";
      continue;
    }
    if (mainHeaders.test(line.replace(/:$/, ""))) {
      currentBoard = "main";
      continue;
    }
    if (categoryHeader.test(line)) continue;

    if (/^(SB|SIDEBOARD):\s*/i.test(line)) {
      currentBoard = "sideboard";
      line = line.replace(/^(SB|SIDEBOARD):\s*/i, "");
    }

    const match = line.match(/^(\d{1,3})\s*[xX]?\s+(.+)$/);
    if (!match) continue;

    const quantity = Number(match[1]);
    const name = cleanCardName(match[2]);
    if (!name || quantity < 1 || quantity > 999) continue;

    const key = `${currentBoard}:${name.toLocaleLowerCase("en")}`;
    const previous = aggregated.get(key);
    if (previous) previous.quantity += quantity;
    else aggregated.set(key, { board: currentBoard, quantity, name });
  }

  const cards = [...aggregated.values()];
  return {
    cards,
    mainCount: cards.filter((card) => card.board === "main").reduce((sum, card) => sum + card.quantity, 0),
    sideboardCount: cards.filter((card) => card.board === "sideboard").reduce((sum, card) => sum + card.quantity, 0),
  };
}
