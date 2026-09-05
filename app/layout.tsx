import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/manrope";
import "@fontsource/cormorant-garamond/600.css";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const themeScript = `
  (() => {
    try {
      const savedTheme = window.localStorage.getItem("pdh-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = savedTheme === "dark" || (!savedTheme && prefersDark);
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    } catch (_) {}
  })();
`;

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "La Posada del Hechicero | Juegos y comunidad en Valdivia",
    template: "%s | La Posada del Hechicero",
  },
  description:
    "Juegos de mesa, Magic: The Gathering y torneos en el corazon de Valdivia.",
  openGraph: {
    title: "La Posada del Hechicero",
    description: "Tu mesa te esta esperando en Valdivia.",
    locale: "es_CL",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
