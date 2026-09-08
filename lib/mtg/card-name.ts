export interface CardNameData {
  id: string;
  oracle_id?: string;
  name: string;
  printed_name?: string;
  card_faces?: Array<{
    name: string;
    printed_name?: string;
  }>;
}

export function normalizeCardName(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("es");
}

export function getCardNameAliases(card: CardNameData) {
  const aliases = new Set<string>([card.name]);
  if (card.printed_name) aliases.add(card.printed_name);

  if (card.card_faces?.length) {
    const printedFaces: string[] = [];
    for (const face of card.card_faces) {
      aliases.add(face.name);
      if (face.printed_name) {
        aliases.add(face.printed_name);
        printedFaces.push(face.printed_name);
      }
    }
    if (printedFaces.length === card.card_faces.length) aliases.add(printedFaces.join(" // "));
  }

  return [...aliases];
}

export function indexCardNames<T extends CardNameData>(cards: Map<string, T>, card: T) {
  for (const alias of getCardNameAliases(card)) cards.set(normalizeCardName(alias), card);
}

export function findCardByName<T extends CardNameData>(cards: Map<string, T>, requestedName: string) {
  return cards.get(normalizeCardName(requestedName));
}

export function findUniqueCardByLocalizedName<T extends CardNameData>(candidates: T[], requestedName: string) {
  const requested = normalizeCardName(requestedName);
  const matches = candidates.filter((card) =>
    getCardNameAliases(card).some((alias) => normalizeCardName(alias) === requested),
  );
  const cardsByOracleId = new Map<string, T>();
  for (const card of matches) cardsByOracleId.set(card.oracle_id ?? card.id, card);
  return cardsByOracleId.size === 1 ? [...cardsByOracleId.values()][0] : undefined;
}
