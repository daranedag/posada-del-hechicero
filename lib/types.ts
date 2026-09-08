export type ProductCategory = "board-game" | "tcg" | "accessory";
export type GameSystem = "magic" | "pokemon" | "mitos-y-leyendas";

export interface Product {
  id: string;
  slug: string;
  category: ProductCategory;
  game_system: GameSystem | null;
  name: string;
  eyebrow: string | null;
  description: string;
  price_clp: number | null;
  availability: "disponible" | "preventa" | "agotado" | "consultar";
  image_url: string | null;
  is_featured: boolean;
}

export interface StoreEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  event_type: "board-game" | GameSystem | "community";
  format_label: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string;
  capacity: number | null;
  price_clp: number | null;
  registration_url: string | null;
}

export interface Tournament {
  id: string;
  code: string;
  name: string;
  format_code: string;
  starts_at: string;
  submission_deadline: string;
  location: string;
  max_players: number | null;
  public_notes: string | null;
  status: "draft" | "open" | "locked" | "completed" | "cancelled";
}

export interface TournamentFormat {
  code: string;
  label: string;
  scryfall_key: string;
  min_main_cards: number;
  max_sideboard_cards: number;
  max_copies: number;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "archived";
  created_at: string;
}
