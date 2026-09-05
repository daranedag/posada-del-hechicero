import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  AtSign,
  Clock3,
  ExternalLink,
  Globe2,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
} from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import {
  defaultHomeContent,
  getHomeContent,
  type SiteItem,
  type SiteMedia,
  type SiteSection,
  type SiteSectionKey,
} from "@/lib/data/site-content";

export const revalidate = 300;

function externalProps(href: string | null) {
  return href ? { href, target: "_blank" as const, rel: "noreferrer" } : { href: "#contacto" };
}

function iconForSocial(item: SiteItem) {
  const value = `${item.title} ${item.href ?? ""}`.toLowerCase();
  if (value.includes("instagram")) return AtSign;
  if (value.includes("facebook")) return AtSign;
  if (value.includes("whatsapp")) return MessageCircle;
  return Globe2;
}

export default async function Home() {
  const content = await getHomeContent();
  const sections = new Map(content.sections.map((section) => [section.key, section]));
  const fallbackHero = defaultHomeContent.sections.find((section) => section.key === "hero")!;
  const hero = sections.get("hero") ?? fallbackHero;
  const heroMedia = content.media.find((media) => media.section_key === "hero");

  const section = (key: SiteSectionKey) => sections.get(key);
  const items = (key: SiteSectionKey) => content.items.filter((item) => item.section_key === key);
  const media = (key: SiteSectionKey) => content.media.filter((item) => item.section_key === key);

  return (
    <>
      <section className="pdh-container pt-5 sm:pt-8">
        <div className="relative min-h-[680px] overflow-hidden rounded-[1.75rem] bg-[#170d20] text-white shadow-ember sm:min-h-[700px] lg:min-h-[640px]">
          {heroMedia && (
            <Image
              src={heroMedia.image_url}
              alt={heroMedia.alt_text || "La Posada del Hechicero"}
              fill
              preload
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover object-center opacity-80"
            />
          )}
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
                <Sparkles className="size-4" /> {hero.kicker}
              </p>
              <h1 className="max-w-2xl text-balance font-display text-5xl font-semibold leading-[0.92] sm:text-6xl lg:text-7xl">
                {hero.title}
              </h1>
              <p className="mt-6 max-w-xl text-balance text-base leading-7 text-white/72 sm:text-lg">
                {hero.body}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="#contacto" className="pdh-button-primary bg-[#d64f9d] text-white hover:bg-[#bd3d87]">
                  Contáctanos <ArrowRight className="size-4" />
                </Link>
                <Link href="/torneos" className="pdh-button-secondary border-white/25 bg-white/10 text-white hover:bg-white/15">
                  Inscribir mi mazo
                </Link>
              </div>
            </div>

            <div className="grid max-w-2xl grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {[
                ["Juegos", "Para todos los gustos"],
                ["Comunidad", "Mesas y eventos"],
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

      <SocialSection section={section("social")} items={items("social")} media={media("social")} />
      <AddressSection section={section("address")} items={items("address")} media={media("address")} />
      <HoursSection section={section("hours")} items={items("hours")} />
      <GameRequestSection section={section("game_request")} items={items("game_request")} media={media("game_request")} />
      <ContactSection section={section("contact")} />
    </>
  );
}

function SocialSection({ section, items, media }: { section?: SiteSection; items: SiteItem[]; media: SiteMedia[] }) {
  if (!section) return null;
  return (
    <section id="redes" className="pdh-section pdh-container scroll-mt-28" aria-labelledby="social-title">
      <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr] lg:items-stretch">
        <div className="flex flex-col justify-between rounded-[1.4rem] bg-primary p-8 text-primary-foreground sm:p-10">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] opacity-70">
              <AtSign className="size-4" /> {section.kicker}
            </p>
            <h2 id="social-title" className="mt-5 text-balance text-4xl leading-none sm:text-5xl">{section.title}</h2>
            <p className="mt-5 text-sm leading-7 opacity-75">{section.body}</p>
          </div>
          <div className="mt-10 grid gap-3">
            {items.map((item) => {
              const Icon = iconForSocial(item);
              return (
                <a key={item.id} {...externalProps(item.href)} className="group flex items-center justify-between gap-4 rounded-xl border border-white/15 bg-white/10 px-4 py-3 font-bold transition hover:bg-white/15">
                  <span className="flex items-center gap-3"><Icon className="size-4" /> <span><span className="block text-sm">{item.title}</span><span className="block text-xs font-medium opacity-65">{item.body}</span></span></span>
                  <ExternalLink className="size-4 opacity-55 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              );
            })}
          </div>
        </div>

        {media.length > 0 && (
          <div className={`grid gap-4 ${media.length === 1 ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3"}`}>
            {media.map((item, index) => (
              <figure key={item.id} className={`group relative min-h-80 overflow-hidden rounded-[1.25rem] bg-muted ${media.length > 1 && index === media.length - 1 && media.length % 3 === 0 ? "col-span-2 md:col-span-1" : ""}`}>
                <Image src={item.image_url} alt={item.alt_text || item.caption || section.title} fill sizes="(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 24vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                {item.caption && <><div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#180b20] to-transparent" /><figcaption className="absolute inset-x-0 bottom-0 p-4 text-sm font-bold text-white">{item.caption}</figcaption></>}
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function AddressSection({ section, items, media }: { section?: SiteSection; items: SiteItem[]; media: SiteMedia[] }) {
  if (!section) return null;
  return (
    <section id="direccion" className="scroll-mt-28 border-y border-white/10 bg-[#1b1025] text-[#faf3fc]" aria-labelledby="address-title">
      <div className="pdh-container grid gap-8 py-16 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-20">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#f08ac3]"><MapPin className="size-4" /> {section.kicker}</p>
          <h2 id="address-title" className="mt-4 max-w-2xl text-balance text-4xl leading-none sm:text-5xl">{section.title}</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/62">{section.body}</p>
          <div className="mt-8 grid gap-3">
            {items.map((item) => (
              <a key={item.id} {...externalProps(item.href)} className="group flex max-w-xl items-center gap-4 rounded-xl border border-white/10 bg-white/[0.055] p-4 transition hover:bg-white/10">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#d64f9d]/15 text-[#f3a8d2]"><MapPin className="size-5" /></span>
                <span><span className="block font-bold">{item.title}</span><span className="mt-1 block text-sm text-white/60">{item.body}</span></span>
                <ArrowRight className="ml-auto size-4 shrink-0 text-white/40 transition group-hover:translate-x-1" />
              </a>
            ))}
          </div>
        </div>
        <div className="relative min-h-80 overflow-hidden rounded-[1.4rem] border border-white/10 bg-[radial-gradient(circle_at_50%_20%,rgba(214,79,157,.28),transparent_50%),linear-gradient(145deg,#352047,#24132f)]">
          {media[0] ? <Image src={media[0].image_url} alt={media[0].alt_text || section.title} fill sizes="(max-width: 1023px) 100vw, 45vw" className="object-cover opacity-80" /> : <div className="absolute inset-0 grid place-items-center p-8 text-center"><div><span className="mx-auto grid size-20 place-items-center rounded-full border border-white/15 bg-white/10"><MapPin className="size-8 text-[#f08ac3]" /></span><p className="mt-5 font-display text-3xl">Valdivia</p><p className="mt-2 text-sm text-white/50">Aníbal Pinto 1843 · Local 3</p></div></div>}
        </div>
      </div>
    </section>
  );
}

function HoursSection({ section, items }: { section?: SiteSection; items: SiteItem[] }) {
  if (!section) return null;
  return (
    <section id="horarios" className="pdh-section pdh-container scroll-mt-28" aria-labelledby="hours-title">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p className="pdh-kicker"><Clock3 className="size-4" /> {section.kicker}</p>
          <h2 id="hours-title" className="mt-4 text-balance text-4xl leading-none sm:text-5xl">{section.title}</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">{section.body}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => {
            const content = <><span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-primary"><Clock3 className="size-5" /></span><span><span className="block font-bold">{item.title}</span><span className="mt-1 block text-sm leading-6 text-muted-foreground">{item.body}</span></span>{item.href && <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground" />}</>;
            return item.href ? <a key={item.id} {...externalProps(item.href)} className="pdh-panel flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-copper/40">{content}</a> : <div key={item.id} className="pdh-panel flex items-center gap-4 p-5">{content}</div>;
          })}
        </div>
      </div>
    </section>
  );
}

function GameRequestSection({ section, items, media }: { section?: SiteSection; items: SiteItem[]; media: SiteMedia[] }) {
  if (!section) return null;
  const action = items[0];
  return (
    <section id="buscar-juego" className="pdh-container scroll-mt-28 pb-16 sm:pb-24" aria-labelledby="game-request-title">
      <div className="relative overflow-hidden rounded-[1.5rem] bg-[linear-gradient(125deg,#4e2877_0%,#8f326d_100%)] p-8 text-white shadow-ember sm:p-12">
        {media[0] && <Image src={media[0].image_url} alt={media[0].alt_text || ""} fill sizes="100vw" className="object-cover opacity-20 mix-blend-luminosity" />}
        <div className="absolute -right-24 -top-24 size-80 rounded-full border border-white/10" />
        <div className="absolute -bottom-32 right-24 size-72 rounded-full bg-[#d64f9d]/25 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#f3b4d7]"><Search className="size-4" /> {section.kicker}</p>
            <h2 id="game-request-title" className="mt-4 max-w-3xl text-balance text-4xl leading-none sm:text-5xl">{section.title}</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/68">{section.body}</p>
            {action?.body && <p className="mt-3 max-w-2xl text-sm text-white/50">{action.body}</p>}
          </div>
          <a {...externalProps(action?.href ?? null)} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#4e2877] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#fff7fb]">
            <MessageCircle className="size-4" /> {action?.title || "Contáctanos"}
          </a>
        </div>
      </div>
    </section>
  );
}

function ContactSection({ section }: { section?: SiteSection }) {
  if (!section) return null;
  return (
    <section id="contacto" className="scroll-mt-28 border-t border-foreground/10 bg-card/45" aria-labelledby="contact-title">
      <div className="pdh-container grid gap-10 py-16 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:py-24">
        <div className="lg:sticky lg:top-32">
          <p className="pdh-kicker"><MessageCircle className="size-4" /> {section.kicker}</p>
          <h2 id="contact-title" className="mt-4 text-balance text-4xl leading-none sm:text-5xl">{section.title}</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">{section.body}</p>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
