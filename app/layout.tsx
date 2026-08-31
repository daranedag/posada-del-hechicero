import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/cormorant-garamond/600.css";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "La Posada del Hechicero | Juegos y comunidad en Valdivia",
    template: "%s | La Posada del Hechicero",
  },
  description:
    "Juegos de mesa, Magic, Pokemon, Mitos y Leyendas y torneos en el corazon de Valdivia.",
  openGraph: {
    title: "La Posada del Hechicero",
    description: "Tu mesa te esta esperando en Valdivia.",
    locale: "es_CL",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
