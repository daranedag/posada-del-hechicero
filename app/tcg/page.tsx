import Link from "next/link";
import { ArrowRight, Flame, Layers3, Sparkles } from "lucide-react";
import { PageHero } from "@/components/page-hero";

export const metadata = { title: "Trading Card Games" };

export default function TcgPage() {
  return (
    <>
      <PageHero kicker="Trading Card Games" title="Colecciona. Construye. Compite." description="Magic: The Gathering, juego organizado y una comunidad que se reúne en Valdivia." icon={Layers3} />
      <section className="pdh-section pdh-container">
        <Link href="/tcg/magic" className="group grid min-h-[360px] overflow-hidden rounded-[1.4rem] bg-[linear-gradient(135deg,#281637_0%,#5b3386_55%,#a63e82_100%)] text-white shadow-ember transition hover:-translate-y-1 hover:shadow-xl md:grid-cols-[0.7fr_1.3fr]">
          <div className="flex items-start p-8 sm:p-10">
            <span className="grid size-14 place-items-center rounded-full border border-white/20 bg-white/10"><Flame className="size-6" /></span>
          </div>
          <div className="flex flex-col justify-end p-8 sm:p-10">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-white/60"><Sparkles className="size-3.5" /> Explorar juego</p>
            <h2 className="text-4xl leading-none sm:text-5xl">Magic: The Gathering</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70">Singles, producto sellado, Commander y circuito competitivo.</p>
            <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold">Entrar <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
          </div>
        </Link>
      </section>
    </>
  );
}
