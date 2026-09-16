import Link from "next/link";
import { ArrowRight, AtSign, MapPin } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

export function SiteFooter() {
  const year = new Intl.DateTimeFormat("es-CL", { year: "numeric", timeZone: "America/Santiago" }).format(new Date());
  const instagram =
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ??
    "https://www.instagram.com/posada.delhechicero/";

  return (
    <footer className="border-t border-white/10 bg-[#1b1025] text-[#f8effc]">
      <div className="pdh-container grid gap-8 py-10 sm:py-12 md:grid-cols-[1.2fr_1fr] md:items-start md:gap-12 lg:gap-20">
        <div className="min-w-0 max-w-md">
          <div className="flex items-center gap-4">
            <BrandMark className="h-20 shrink-0" />
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold">La Posada del Hechicero</p>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Jugar es encontrarse</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-white/60">
            Juegos de mesa, TCG y juego organizado en el corazón de Valdivia.
          </p>
          <Link href="/torneos" className="mt-6 inline-flex min-h-11 items-center gap-3 rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold transition hover:border-white/40 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            Portal de torneos <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="min-w-0 border-t border-white/10 pt-8 md:border-l md:border-t-0 md:pl-10 md:pt-2 lg:pl-14">
          <h2 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-copper">Encuéntranos</h2>
          <address className="mt-5 grid gap-4 text-sm not-italic">
            <p className="flex items-start gap-3 leading-6 text-white/70">
              <MapPin className="mt-1 size-4 shrink-0 text-copper" aria-hidden="true" />
              <span>Aníbal Pinto 1843, Local 3<br />Valdivia, Los Ríos</span>
            </p>
            <a href={instagram} target="_blank" rel="noreferrer" className="inline-flex min-h-11 w-fit items-center gap-3 font-bold transition hover:text-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              <AtSign className="size-4 shrink-0 text-copper" aria-hidden="true" /> <span className="break-all">@posada.delhechicero</span>
            </a>
          </address>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="pdh-container flex flex-col items-center justify-between gap-3 py-5 text-xs leading-5 text-white/60 sm:flex-row">
          <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
            <span>De</span>
            <svg viewBox="0 0 24 16" role="img" aria-label="Valdivia" className="inline-block h-3.5 w-[21px] shrink-0 rounded-[1px] ring-1 ring-white/20">
              <title>Bandera de Valdivia</title>
              <path fill="#fff" d="M0 0h24v16H0z" />
              <path d="m0 0 24 16M24 0 0 16" stroke="#d52b1e" strokeWidth="2" />
            </svg>
            <span>con</span>
            <span role="img" aria-label="amor">❤️</span>
            <span>por</span>
            <a href="https://diegui.dev/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#f08ac3] underline decoration-[#f08ac3]/50 underline-offset-4 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">diegui.dev</a>
          </p>
          <p className="text-center">© {year} Posada del Hechicero</p>
        </div>
      </div>
    </footer>
  );
}
