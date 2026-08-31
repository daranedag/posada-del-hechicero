import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Dice5,
  Layers3,
  MapPin,
  Shield,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { getSiteSetting } from "@/lib/data/public";

export const revalidate = 300;

const worlds = [
  {
    href: "/juegos-de-mesa",
    title: "Juegos de mesa",
    description: "Estrategia, party games y aventuras para descubrir en grupo.",
    icon: Dice5,
    tone: "bg-[#e7d7b5] text-[#3b2518]",
  },
  {
    href: "/tcg/magic",
    title: "Magic: The Gathering",
    description: "Producto sellado, singles, comunidad y juego competitivo.",
    icon: Layers3,
    tone: "bg-[#183d35] text-[#f4ead7]",
  },
  {
    href: "/tcg/pokemon",
    title: "Pokemon TCG",
    description: "Colecciona, aprende a jugar y encuentra tu proximo mazo.",
    icon: Zap,
    tone: "bg-[#d8a23a] text-[#2b2110]",
  },
  {
    href: "/tcg/mitos-y-leyendas",
    title: "Mitos y Leyendas",
    description: "El juego chileno que sigue reuniendo generaciones.",
    icon: Shield,
    tone: "bg-[#7f3c2c] text-[#fff0df]",
  },
];

export default async function Home() {
  const hero = await getSiteSetting("home_hero");
  const heroImage = hero?.image_url ?? "/images/posada-hero.png";

  return (
    <>
      <section className="pdh-container pt-6 sm:pt-10">
        <div className="relative min-h-[620px] overflow-hidden rounded-[1.5rem] bg-[#0d1714] text-[#f8eedc] shadow-ember sm:min-h-[650px] lg:min-h-[610px]">
          <Image
            src={heroImage}
            alt="Amigos compartiendo una partida en una tienda de juegos"
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover object-[58%_center] opacity-65"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,17,14,.98)_0%,rgba(8,17,14,.86)_34%,rgba(8,17,14,.2)_72%,rgba(8,17,14,.1)_100%)]" />
          <div className="relative z-10 flex min-h-[620px] max-w-3xl flex-col justify-between p-7 sm:min-h-[650px] sm:p-12 lg:min-h-[610px] lg:p-16">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#ead4a8] backdrop-blur">
              <MapPin className="size-3.5 text-copper" />
              Valdivia · Juegos · Comunidad
            </div>

            <div className="py-14 sm:py-10">
              <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#d89a68]">
                <Sparkles className="size-4" /> Tu proxima aventura comienza aqui
              </p>
              <h1 className="max-w-2xl text-balance font-display text-5xl font-semibold leading-[0.95] sm:text-6xl lg:text-7xl">
                Una mesa. Mil historias.
              </h1>
              <p className="mt-6 max-w-xl text-balance text-base leading-7 text-white/72 sm:text-lg">
                Juegos de mesa, TCG y torneos para quienes saben que la mejor parte del juego es con quien lo compartes.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/eventos" className="pdh-button-primary bg-[#d07b43] text-white hover:bg-[#b96631]">
                  Ver proximos eventos <ArrowRight className="size-4" />
                </Link>
                <Link href="/torneos" className="pdh-button-secondary border-white/25 bg-white/10 text-white hover:bg-white/15">
                  Inscribir mi mazo
                </Link>
              </div>
            </div>

            <div className="grid max-w-xl grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {[
                ["WPN & RCQ", "Juego organizado"],
                ["4 formatos", "Validacion digital"],
                ["Local 3", "Anibal Pinto 1843"],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-xl border border-white/12 bg-black/20 p-3 backdrop-blur-sm">
                  <p className="font-bold text-[#f4dfbd]">{title}</p>
                  <p className="mt-0.5 text-xs text-white/50">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pdh-section pdh-container" aria-labelledby="mundos-title">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="pdh-kicker">Elige tu mundo</p>
            <h2 id="mundos-title" className="mt-4 max-w-2xl text-balance text-4xl leading-none sm:text-5xl">
              Hay una mesa esperandote.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Explora el catalogo, descubre comunidades activas y reserva un lugar en la proxima fecha.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {worlds.map(({ href, title, description, icon: Icon, tone }, index) => (
            <Link
              key={href}
              href={href}
              className={`group flex min-h-64 flex-col justify-between rounded-[1.25rem] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${tone} ${
                index === 1 ? "lg:-translate-y-3 lg:hover:-translate-y-4" : ""
              }`}
            >
              <span className="grid size-11 place-items-center rounded-full border border-current/20 bg-white/10">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="text-2xl leading-none">{title}</h3>
                <p className="mt-3 text-sm leading-6 opacity-70">{description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]">
                  Descubrir <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-foreground/10 bg-[#142821] text-[#f5ead7]">
        <div className="pdh-container grid gap-10 py-16 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-20">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#d18a59]">
              <Trophy className="size-4" /> Torneos sin papeleo
            </p>
            <h2 className="mt-4 max-w-xl text-balance text-4xl leading-none sm:text-5xl">
              Tu decklist, validada antes de sentarte a jugar.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/62">
              Pega tu lista desde Moxfield, ManaBox, Arena o texto. El sistema revisa cada carta, el formato y el sideboard con datos de Scryfall.
            </p>
            <Link href="/torneos" className="mt-7 inline-flex items-center gap-2 font-bold text-[#efb17d]">
              Ir al portal de torneos <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.055] p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/45">Validacion automatica</p>
                <p className="mt-1 font-display text-2xl">Pioneer · Lista #03</p>
              </div>
              <span className="rounded-full bg-[#79b491]/15 px-3 py-1.5 text-xs font-bold text-[#9bd0ad]">Lista legal</span>
            </div>
            <div className="mt-6 grid gap-3">
              {[
                ["60 cartas en el mazo principal", "Cumple"],
                ["15 cartas en el sideboard", "Cumple"],
                ["Legalidad y cartas prohibidas", "Verificado"],
              ].map(([label, status]) => (
                <div key={label} className="flex items-center justify-between gap-4 rounded-lg bg-black/15 px-4 py-3 text-sm">
                  <span className="flex items-center gap-3 text-white/72"><CheckCircle2 className="size-4 text-[#8fc9a2]" />{label}</span>
                  <span className="text-xs font-bold text-white/45">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pdh-section pdh-container">
        <div className="pdh-panel grid overflow-hidden lg:grid-cols-[0.72fr_1.28fr]">
          <div className="bg-[#d8a36b] p-8 text-[#2b1b10] sm:p-10">
            <CalendarDays className="size-8" strokeWidth={1.6} />
            <p className="mt-10 text-xs font-bold uppercase tracking-[0.18em]">Agenda destacada</p>
            <p className="mt-2 font-display text-5xl font-semibold leading-none">14 Nov</p>
            <p className="mt-2 text-sm font-bold">13:00 hrs · Valdivia</p>
          </div>
          <div className="p-8 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-teal">Magic: The Gathering</p>
            <h2 className="mt-3 text-4xl leading-none">Regional Qualifier · Standard</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              La Posada aparece en el calendario regional de clasificatorios. Revisa las condiciones e inscribete directamente con la tienda.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/eventos" className="pdh-button-primary">Ver calendario</Link>
              <a
                href="https://www.instagram.com/posada.delhechicero/"
                target="_blank"
                rel="noreferrer"
                className="pdh-button-secondary"
              >
                Consultar cupos
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
