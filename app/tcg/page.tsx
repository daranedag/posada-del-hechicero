import Link from "next/link";
import { ArrowRight, Flame, Layers3, Shield, Sparkles, Zap } from "lucide-react";
import { PageHero } from "@/components/page-hero";

const games = [
  { href: "/tcg/magic", name: "Magic: The Gathering", copy: "Singles, producto sellado, Commander y circuito competitivo.", icon: Flame, tone: "bg-[#193c34] text-[#f6ebd8]" },
  { href: "/tcg/pokemon", name: "Pokémon TCG", copy: "Colección, juego casual y una puerta de entrada para nuevos entrenadores.", icon: Zap, tone: "bg-[#dba63f] text-[#291f0e]" },
  { href: "/tcg/mitos-y-leyendas", name: "Mitos y Leyendas", copy: "Estrategia y mitología en el TCG chileno que marcó generaciones.", icon: Shield, tone: "bg-[#803d2c] text-[#fff1df]" },
];

export const metadata = { title: "Trading Card Games" };

export default function TcgPage() {
  return (
    <>
      <PageHero kicker="Trading Card Games" title="Colecciona. Construye. Compite." description="Tres comunidades, incontables estrategias y un mismo lugar para reunirse en Valdivia." icon={Layers3} />
      <section className="pdh-section pdh-container">
        <div className="grid gap-5 lg:grid-cols-3">
          {games.map(({ href, name, copy, icon: Icon, tone }) => (
            <Link key={href} href={href} className={`group flex min-h-[340px] flex-col justify-between rounded-[1.4rem] p-8 transition hover:-translate-y-1 hover:shadow-xl ${tone}`}>
              <span className="grid size-12 place-items-center rounded-full border border-current/20 bg-white/10"><Icon className="size-5" /></span>
              <div>
                <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] opacity-60"><Sparkles className="size-3.5" /> Explorar juego</p>
                <h2 className="text-4xl leading-none">{name}</h2>
                <p className="mt-4 text-sm leading-6 opacity-70">{copy}</p>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold">Entrar <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
