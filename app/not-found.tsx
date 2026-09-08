import Link from "next/link";
import { ArrowLeft, Compass, ShieldQuestion, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <section className="pdh-container flex min-h-[70vh] items-center py-10 sm:py-16">
      <div className="relative w-full overflow-hidden rounded-[1.75rem] bg-[linear-gradient(135deg,#1b1025_0%,#3b2053_52%,#742c64_100%)] px-6 py-14 text-[#faf3fc] shadow-ember sm:px-12 sm:py-20 lg:px-16">
        <div className="absolute -right-24 -top-24 size-72 rounded-full border border-white/10" />
        <div className="absolute -bottom-32 right-16 size-80 rounded-full bg-[#d64f9d]/20 blur-3xl" />
        <div className="absolute left-[45%] top-10 size-36 rounded-full border border-white/[0.06]" />

        <div className="relative grid gap-12 lg:grid-cols-[1fr_0.55fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f3a8d2]">
              <Sparkles className="size-4" /> Error 404 · Ruta desconocida
            </p>
            <h1 className="mt-5 max-w-3xl text-balance text-5xl leading-[0.92] sm:text-6xl lg:text-7xl">
              Este portal no lleva a ninguna sala.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
              Puede que el enlace esté incompleto, haya cambiado de lugar o que algún hechizo lo haya hecho desaparecer.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/" className="pdh-button-primary bg-[#d64f9d] text-white hover:bg-[#bd3d87]">
                <ArrowLeft className="size-4" /> Volver a la Posada
              </Link>
              <Link href="/torneos" className="pdh-button-secondary border-white/20 bg-white/10 text-white hover:bg-white/15">
                Ver torneos <Compass className="size-4" />
              </Link>
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-sm place-items-center rounded-[1.5rem] border border-white/10 bg-black/15 px-6 py-10 text-center backdrop-blur-sm lg:py-14">
            <span className="grid size-20 place-items-center rounded-full border border-[#f3a8d2]/25 bg-[#d64f9d]/15 text-[#f3a8d2]">
              <ShieldQuestion className="size-9" />
            </span>
            <p className="mt-6 font-display text-7xl font-semibold leading-none text-white/95">404</p>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-white/45">Página no encontrada</p>
          </div>
        </div>
      </div>
    </section>
  );
}
