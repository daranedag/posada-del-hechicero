import JSZip from "jszip";

export interface ExportTournament { name: string; format_code: string; starts_at: string; location: string }
export interface ExportPlayer { id: string; first_name: string; last_name: string; email: string | null }
export interface ExportSubmission { id: string; player_id: string; version_number: number }
export interface ExportStanding { player_id: string; rank: number; match_points: number; wins: number; losses: number; draws: number }
export interface ExportCard { submission_id: string; board: "main" | "sideboard"; quantity: number; card_name: string }

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function safeExportName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export async function buildMtgtop8Zip(input: {
  tournament: ExportTournament;
  players: ExportPlayer[];
  submissions: ExportSubmission[];
  standings: ExportStanding[];
  cards: ExportCard[];
}) {
  const playerById = new Map(input.players.map((player) => [player.id, player]));
  const standingByPlayer = new Map(input.standings.map((standing) => [standing.player_id, standing]));
  const zip = new JSZip();
  const date = input.tournament.starts_at.slice(0, 10);

  zip.file("evento-mtgtop8.txt", [
    `Title: ${input.tournament.name}`,
    `Place: ${input.tournament.location}`,
    `Format: ${input.tournament.format_code}`,
    `Date: ${date}`,
    `Players: ${input.players.length}`,
    "",
    "Este paquete deja los datos listos para copiar al formulario web de MTGTop8.",
  ].join("\n"));

  zip.file("standings.csv", [
    ["Rank", "Player", "Email", "Match Points", "Wins", "Losses", "Draws"].map(csvCell).join(","),
    ...input.standings.map((standing) => {
      const player = playerById.get(standing.player_id);
      return [standing.rank, player ? `${player.first_name} ${player.last_name}` : "", player?.email ?? "", standing.match_points, standing.wins, standing.losses, standing.draws].map(csvCell).join(",");
    }),
  ].join("\n"));

  for (const submission of input.submissions) {
    const player = playerById.get(submission.player_id);
    if (!player) continue;
    const standing = standingByPlayer.get(player.id);
    const deckCards = input.cards.filter((card) => card.submission_id === submission.id);
    const main = deckCards.filter((card) => card.board === "main").map((card) => `${card.quantity} ${card.card_name}`);
    const side = deckCards.filter((card) => card.board === "sideboard").map((card) => `SB: ${card.quantity} ${card.card_name}`);
    const rank = standing?.rank ? String(standing.rank).padStart(2, "0") : "00";
    zip.file(`decks/${rank}-${safeExportName(`${player.first_name}-${player.last_name}`)}.txt`, [
      `// Player: ${player.first_name} ${player.last_name}`,
      `// Rank: ${standing?.rank ?? ""}`,
      `// Deck version: ${submission.version_number}`,
      "",
      ...main,
      "",
      ...side,
    ].join("\n"));
  }

  zip.file("LEEME.txt", "Los nombres de cartas se exportan en inglés desde Scryfall. En MTGTop8, crea el evento con evento-mtgtop8.txt y pega cada archivo de la carpeta decks en su formulario de decklist. Las líneas de sideboard usan el prefijo SB: aceptado por la plataforma.");
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
