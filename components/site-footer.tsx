import Link from "next/link";
import { AtSign, MapPin } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

export function SiteFooter() {
  const instagram =
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ??
    "https://www.instagram.com/posada.delhechicero/";

  return (
    <footer className="border-t border-white/10 bg-[#0d1714] text-[#f3ead7]">
      <div className="pdh-container grid gap-10 py-12 md:grid-cols-[1.3fr_0.7fr_0.8fr]">
        <div className="max-w-md">
          <div className="flex items-center gap-4">
            <BrandMark />
            <div>
              <p className="font-display text-2xl font-semibold">La Posada del Hechicero</p>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Jugar es encontrarse</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-white/60">
            Juegos de mesa, TCG y juego organizado en el corazon de Valdivia.
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-copper">Explora</p>
          <div className="mt-4 grid gap-2 text-sm text-white/70">
            <Link href="/juegos-de-mesa">Juegos de mesa</Link>
            <Link href="/tcg">TCG</Link>
            <Link href="/eventos">Calendario</Link>
            <Link href="/torneos">Portal de torneos</Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-copper">Encuentranos</p>
          <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-white/70">
            <MapPin className="mt-1 size-4 shrink-0" />
            Anibal Pinto 1843, Local 3<br />Valdivia, Los Rios
          </p>
          <a href={instagram} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold">
            <AtSign className="size-4" /> @posada.delhechicero
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/35">
        Demo conceptual · Contenidos y disponibilidad sujetos a confirmacion de la tienda.
      </div>
    </footer>
  );
}
