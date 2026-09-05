import { publicInsforge } from "@/lib/insforge/public";

export const SITE_SECTION_KEYS = [
  "hero",
  "social",
  "address",
  "hours",
  "game_request",
  "contact",
] as const;

export type SiteSectionKey = (typeof SITE_SECTION_KEYS)[number];
export type SiteItemType = "social" | "address" | "hours" | "contact" | "text";

export interface SiteSection {
  key: SiteSectionKey;
  admin_label: string;
  kicker: string;
  title: string;
  body: string;
  sort_order: number;
  is_visible: boolean;
}

export interface SiteItem {
  id: string;
  section_key: SiteSectionKey;
  item_type: SiteItemType;
  title: string;
  body: string;
  href: string | null;
  sort_order: number;
  is_visible: boolean;
}

export interface SiteMedia {
  id: string;
  section_key: SiteSectionKey;
  image_url: string;
  image_key: string | null;
  alt_text: string;
  caption: string;
  sort_order: number;
  is_visible: boolean;
}

export interface HomeContent {
  sections: SiteSection[];
  items: SiteItem[];
  media: SiteMedia[];
}

export const defaultHomeContent: HomeContent = {
  sections: [
    {
      key: "hero",
      admin_label: "Hero principal",
      kicker: "Tu próxima aventura comienza aquí",
      title: "Una mesa. Mil historias.",
      body: "Juegos de mesa, Magic y torneos para quienes saben que la mejor parte del juego es con quién lo compartes.",
      sort_order: 0,
      is_visible: true,
    },
    {
      key: "social",
      admin_label: "Redes sociales",
      kicker: "La Posada en línea",
      title: "Síguenos y entérate de todo.",
      body: "Preventas, novedades, lanzamientos y torneos: nuestras redes son el lugar más rápido para saber qué está pasando en la tienda.",
      sort_order: 10,
      is_visible: true,
    },
    {
      key: "address",
      admin_label: "Dirección",
      kicker: "Ven a conocernos",
      title: "Tu próxima partida está en Valdivia.",
      body: "Estamos en pleno centro de Valdivia. Acércate a descubrir juegos, conocer la comunidad y encontrar una nueva mesa.",
      sort_order: 20,
      is_visible: true,
    },
    {
      key: "hours",
      admin_label: "Horarios",
      kicker: "Planifica tu visita",
      title: "¿Cuándo nos encontramos?",
      body: "Nuestros horarios pueden cambiar durante eventos y días festivos. Confirma las novedades en Instagram antes de venir.",
      sort_order: 30,
      is_visible: true,
    },
    {
      key: "game_request",
      admin_label: "¿Buscas algún juego?",
      kicker: "Te ayudamos a encontrarlo",
      title: "¿Buscas algún juego en especial?",
      body: "Cuéntanos cuál buscas. Revisamos disponibilidad y también podemos orientarte si quieres descubrir algo nuevo.",
      sort_order: 40,
      is_visible: true,
    },
    {
      key: "contact",
      admin_label: "Formulario de contacto",
      kicker: "Hablemos",
      title: "¿Tienes alguna duda?",
      body: "Déjanos tu consulta y te responderemos al correo que nos indiques.",
      sort_order: 50,
      is_visible: true,
    },
  ],
  items: [
    {
      id: "instagram",
      section_key: "social",
      item_type: "social",
      title: "Instagram",
      body: "@posada.delhechicero",
      href: "https://www.instagram.com/posada.delhechicero/",
      sort_order: 10,
      is_visible: true,
    },
    {
      id: "store-address",
      section_key: "address",
      item_type: "address",
      title: "La Posada del Hechicero",
      body: "Aníbal Pinto 1843, Local 3, Valdivia",
      href: "https://maps.google.com/?q=Anibal+Pinto+1843+Local+3+Valdivia",
      sort_order: 10,
      is_visible: true,
    },
    {
      id: "current-hours",
      section_key: "hours",
      item_type: "hours",
      title: "Horario actualizado",
      body: "Consulta el horario de hoy en nuestro Instagram.",
      href: "https://www.instagram.com/posada.delhechicero/",
      sort_order: 10,
      is_visible: true,
    },
    {
      id: "game-request",
      section_key: "game_request",
      item_type: "contact",
      title: "Escríbenos por Instagram",
      body: "Indícanos el nombre del juego y te responderemos con su disponibilidad.",
      href: "https://www.instagram.com/posada.delhechicero/",
      sort_order: 10,
      is_visible: true,
    },
  ],
  media: [
    {
      id: "hero",
      section_key: "hero",
      image_url: "/images/igexport-DMDetjAOfau.jpg",
      image_key: null,
      alt_text: "Jugadores reunidos en el local de La Posada del Hechicero en Valdivia",
      caption: "",
      sort_order: 10,
      is_visible: true,
    },
    {
      id: "social-one",
      section_key: "social",
      image_url: "/images/igexport-DctcBb5keDr.jpg",
      image_key: null,
      alt_text: "Afiche de una preventa de Magic: The Gathering en La Posada del Hechicero",
      caption: "Prelanzamientos",
      sort_order: 10,
      is_visible: true,
    },
    {
      id: "social-two",
      section_key: "social",
      image_url: "/images/igexport-DT_pelyFKDm.jpg",
      image_key: null,
      alt_text: "Afiche de un evento de Magic: The Gathering en La Posada del Hechicero",
      caption: "Nuevas colecciones",
      sort_order: 20,
      is_visible: true,
    },
    {
      id: "social-three",
      section_key: "social",
      image_url: "/images/igexport-DYA8_eWluVG.jpg",
      image_key: null,
      alt_text: "Afiche de Store Championship de Magic: The Gathering",
      caption: "Juego competitivo",
      sort_order: 30,
      is_visible: true,
    },
  ],
};

export async function getHomeContent(): Promise<HomeContent> {
  const [sectionsResult, itemsResult, mediaResult] = await Promise.all([
    publicInsforge.database
      .from("pdh_site_sections")
      .select("key,admin_label,kicker,title,body,sort_order,is_visible")
      .order("sort_order", { ascending: true }),
    publicInsforge.database
      .from("pdh_site_items")
      .select("id,section_key,item_type,title,body,href,sort_order,is_visible")
      .order("sort_order", { ascending: true }),
    publicInsforge.database
      .from("pdh_site_media")
      .select("id,section_key,image_url,image_key,alt_text,caption,sort_order,is_visible")
      .order("sort_order", { ascending: true }),
  ]);

  if (sectionsResult.error || itemsResult.error || mediaResult.error) {
    console.error("No se pudo cargar el contenido administrable de la portada", {
      sections: sectionsResult.error?.message,
      items: itemsResult.error?.message,
      media: mediaResult.error?.message,
    });
    return defaultHomeContent;
  }

  return {
    sections: (sectionsResult.data ?? []) as SiteSection[],
    items: (itemsResult.data ?? []) as SiteItem[],
    media: (mediaResult.data ?? []) as SiteMedia[],
  };
}
