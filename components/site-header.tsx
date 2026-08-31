"use client";

import Link from "next/link";
import { AtSign, Menu, MapPin } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/juegos-de-mesa", label: "Juegos de mesa" },
  { href: "/tcg", label: "TCG" },
  { href: "/eventos", label: "Eventos" },
  { href: "/torneos", label: "Inscribir mazo" },
];

export function SiteHeader() {
  const instagram =
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ??
    "https://www.instagram.com/posada.delhechicero/";

  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/90 backdrop-blur-xl">
      <div className="pdh-container flex h-[4.75rem] items-center justify-between gap-5">
        <Link href="/" className="group flex items-center gap-3" aria-label="Inicio">
          <BrandMark className="transition-transform group-hover:rotate-[52deg]" />
          <span className="leading-none">
            <span className="block font-display text-[1.25rem] font-semibold tracking-[-0.02em]">
              La Posada
            </span>
            <span className="mt-1 block text-[0.63rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              del Hechicero
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegacion principal">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-bold text-foreground/70 transition hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="https://maps.google.com/?q=Anibal+Pinto+1843+Local+3+Valdivia"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground transition hover:text-foreground"
          >
            <MapPin className="size-4 text-copper" />
            Valdivia
          </a>
          <a href={instagram} target="_blank" rel="noreferrer" className="pdh-button-primary h-9 px-4">
            <AtSign className="size-4" />
            Instagram
          </a>
        </div>

        <Sheet>
          <SheetTrigger
            aria-label="Abrir menu"
            className="grid size-10 place-items-center rounded-full border border-foreground/15 bg-card lg:hidden"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent className="w-[88%] border-l-foreground/10 bg-background sm:max-w-sm">
            <SheetHeader className="border-b border-foreground/10 p-6 text-left">
              <SheetTitle className="font-display text-2xl">La Posada del Hechicero</SheetTitle>
              <SheetDescription>Anibal Pinto 1843, Local 3 · Valdivia</SheetDescription>
            </SheetHeader>
            <nav className="grid gap-1 p-4" aria-label="Navegacion movil">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-4 py-3 text-base font-bold transition hover:bg-secondary"
                >
                  {item.label}
                </Link>
              ))}
              <a
                href={instagram}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-bold text-primary-foreground"
              >
                <AtSign className="size-4" />
                Hablar por Instagram
              </a>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
