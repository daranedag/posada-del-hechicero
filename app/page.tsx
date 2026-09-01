import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  AtSign,
  CheckCircle2,
  Dice5,
  Layers3,
  MapPin,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

export const revalidate = 300;

const worlds = [
  {
    href: "/juegos-de-mesa",
    title: "Juegos de mesa",
    description: "Estrategia, party games y aventuras para descubrir en grupo.",
    icon: Dice5,
    tone: "border-primary/15 bg-secondary text-secondary-foreground",
  },
  {
    href: "/tcg/magic",
    title: "Magic: The Gathering",
    description: "Producto sellado, comunidad y juego competitivo reconocido por Wizards of the Coast.",
    icon: Layers3,
    tone: "border-white/10 bg-[linear-gradient(135deg,#34204a_0%,#623b91_58%,#a33f82_100%)] text-white",
  },
];

const gallery = [
  {
    src: "/images/igexport-DctcBb5keDr.jpg",
    alt: "Afiche de una preventa de Magic: The Gathering en La Posada del Hechicero",
    label: "Prelanzamientos",
  },
  {
    src: "/images/igexport-DT_pelyFKDm.jpg",
    alt: "Afiche de un evento de Magic: The Gathering en La Posada del Hechicero",
    label: "Nuevas colecciones",
  },
  {
    src: "/images/igexport-DYA8_eWluVG.jpg",
    alt: "Afiche de Store Championship de Magic: The Gathering",
    label: "Juego competitivo",
    className: "col-span-2 md:col-span-1",
  },
];

export default function Home() {
  const instagram =
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ??
    "https://www.instagram.com/posada.delhechicero/";

  return (
    <>
      <section className="pdh-container pt-5 sm:pt-8">
        <div className="relative min-h-[680px] overflow-hidden rounded-[1.75rem] bg-[#170d20] text-white shadow-ember sm:min-h-[700px] lg:min-h-[640px]">
          <Image
            src="/images/igexport-DMDetjAOfau.jpg"
            alt="Jugadores reunidos en el local de La Posada del Hechicero en Valdivia"
            fill
            preload
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover object-center opacity-80"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,8,26,.98)_0%,rgba(31,13,46,.9)_38%,rgba(35,11,48,.38)_72%,rgba(18,8,26,.28)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(213,78,157,.22),transparent_30rem)]" />

          <div className="relative z-10 flex min-h-[680px] max-w-3xl flex-col justify-between p-7 sm:min-h-[700px] sm:p-12 lg:min-h-[640px] lg:p-14">
            <div className="flex items-start justify-between gap-5">
              <Image
                src="/images/logo.png"
                alt="La Posada del Hechicero"
                width={236}
                height={210}
                className="h-32 w-auto drop-shadow-[0_12px_28px_rgba(0,0,0,.45)] sm:h-40"
              />
              <div className="hidden w-fit items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white/80 backdrop-blur sm:inline-flex">
                <MapPin className="size-3.5 text-[#f08ac3]" />
                Valdivia
              </div>
            </div>

            <div className="py-10 sm:py-7">
              <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f2a5d0]">
                <Sparkles className="size-4" /> Tu próxima aventura comienza aquí
              </p>
              <h1 className="max-w-2xl text-balance font-display text-5xl font-semibold leading-[0.92] sm:text-6xl lg:text-7xl">
                Una mesa. Mil historias.
              </h1>
              <p className="mt-6 max-w-xl text-balance text-base leading-7 text-white/72 sm:text-lg">
                Juegos de mesa, Magic y torneos para quienes saben que la mejor parte del juego es con quién lo compartes.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/eventos" className="pdh-button-primary bg-[#d64f9d] text-white hover:bg-[#bd3d87]">
                  Ver próximos eventos <ArrowRight className="size-4" />
                </Link>
                <Link href="/torneos" className="pdh-button-secondary border-white/25 bg-white/10 text-white hover:bg-white/15">
                  Inscribir mi mazo
                </Link>
              </div>
            </div>

            <div className="grid max-w-2xl grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {[
                ["WPN & RCQ", "Juego organizado"],
                ["4 formatos", "Validación digital"],
                ["Local 3", "Aníbal Pinto 1843"],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-xl border border-white/12 bg-black/25 p-3 backdrop-blur-sm">
                  <p className="font-bold text-white">{title}</p>
                  <p className="mt-0.5 text-xs text-white/52">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pdh-section pdh-container" aria-labelledby="mundos-title">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="pdh-kicker">Elige tu mesa</p>
            <h2 id="mundos-title" className="mt-4 max-w-2xl text-balance text-4xl leading-none sm:text-5xl">
              Siempre hay algo nuevo por jugar.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Explora juegos, conoce la comunidad de Magic y reserva un lugar en la próxima fecha.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {worlds.map(({ href, title, description, icon: Icon, tone }) => (
            <Link
              key={href}
              href={href}
              className={`group flex min-h-72 flex-col justify-between rounded-[1.4rem] border p-7 transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8 ${tone}`}
            >
              <span className="grid size-12 place-items-center rounded-full border border-current/20 bg-white/10">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="text-3xl leading-none sm:text-4xl">{title}</h3>
                <p className="mt-3 max-w-lg text-sm leading-6 opacity-75">{description}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]">
                  Descubrir <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#1b1025] text-[#faf3fc]">
        <div className="pdh-container grid gap-10 py-16 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-20">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#f08ac3]">
              <Trophy className="size-4" /> Torneos sin papeleo
            </p>
            <h2 className="mt-4 max-w-xl text-balance text-4xl leading-none sm:text-5xl">
              Tu decklist, validada antes de sentarte a jugar.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/62">
              Pega tu lista desde Moxfield, ManaBox, Arena o texto. El sistema revisa cada carta, el formato y el sideboard con datos de Scryfall.
            </p>
            <Link href="/torneos" className="mt-7 inline-flex items-center gap-2 font-bold text-[#f29dcd]">
              Ir al portal de torneos <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.055] p-6 shadow-[0_24px_70px_-38px_rgba(213,79,157,.8)] sm:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/45">Validación automática</p>
                <p className="mt-1 font-display text-2xl">Pioneer · Lista #03</p>
              </div>
              <span className="rounded-full bg-[#c697ec]/15 px-3 py-1.5 text-xs font-bold text-[#d9b5f4]">Lista legal</span>
            </div>
            <div className="mt-6 grid gap-3">
              {[
                ["60 cartas en el mazo principal", "Cumple"],
                ["15 cartas en el sideboard", "Cumple"],
                ["Legalidad y cartas prohibidas", "Verificado"],
              ].map(([label, status]) => (
                <div key={label} className="flex items-center justify-between gap-4 rounded-lg bg-black/15 px-4 py-3 text-sm">
                  <span className="flex items-center gap-3 text-white/72">
                    <CheckCircle2 className="size-4 text-[#d993c3]" />
                    {label}
                  </span>
                  <span className="text-xs font-bold text-white/45">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pdh-section pdh-container" aria-labelledby="comunidad-title">
        <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-stretch">
          <div className="flex flex-col justify-between rounded-[1.4rem] bg-primary p-8 text-primary-foreground sm:p-10">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] opacity-70">
                <Users className="size-4" /> Comunidad en movimiento
              </p>
              <h2 id="comunidad-title" className="mt-5 text-4xl leading-none sm:text-5xl">
                Así se vive la Posada.
              </h2>
              <p className="mt-5 text-sm leading-7 opacity-75">
                Preventas, lanzamientos y torneos que convierten cada visita en una historia para compartir.
              </p>
            </div>
            <a href={instagram} target="_blank" rel="noreferrer" className="mt-10 inline-flex items-center gap-2 font-bold">
              <AtSign className="size-4" /> Ver novedades en Instagram
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {gallery.map((item) => (
              <figure
                key={item.src}
                className={`group relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-muted ${item.className ?? ""}`}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 22vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#180b20] to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 p-4 text-sm font-bold text-white">
                  {item.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
