import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Globe2,
  Inbox,
  Plus,
  Users,
} from "lucide-react";
import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { formatChileDate } from "@/lib/dates";
import { adminInsforge } from "@/lib/insforge/admin";
import type { Tournament } from "@/lib/types";

export const metadata = { title: "Administración" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdmin();
  const [{ data: tournamentData }, { data: contactData }] = await Promise.all([
    adminInsforge.database
      .from("pdh_tournaments")
      .select("id,code,name,format_code,starts_at,submission_deadline,location,max_players,public_notes,status")
      .order("starts_at", { ascending: false })
      .limit(50),
    adminInsforge.database
      .from("pdh_contact_submissions")
      .select("id,status")
      .eq("status", "new")
      .limit(200),
  ]);
  const tournaments = (tournamentData ?? []) as Tournament[];
  const newMessages = contactData?.length ?? 0;

  return (
    <section className="pdh-container py-10 sm:py-14">
      <AdminNav name={(user.admin as { display_name?: string }).display_name ?? user.email} />

      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="pdh-kicker">Panel privado</p><h1 className="mt-4 text-5xl leading-none">Administrar la Posada</h1></div>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">Actualiza la portada, responde consultas y conserva todas las herramientas de torneos.</p>
      </div>

      <div className="mt-9 grid gap-4 md:grid-cols-3">
        <Link href="/admin/sitio" className="pdh-panel group flex min-h-52 flex-col justify-between p-6 transition hover:-translate-y-1 hover:border-copper/50 hover:shadow-lg">
          <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground"><Globe2 className="size-5" /></span>
          <span><span className="block font-display text-3xl font-semibold">Contenido del sitio</span><span className="mt-2 block text-sm leading-6 text-muted-foreground">Edita secciones, textos, enlaces y fotografías.</span><span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-teal">Administrar <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span></span>
        </Link>
        <Link href="/admin/consultas" className="pdh-panel group flex min-h-52 flex-col justify-between p-6 transition hover:-translate-y-1 hover:border-copper/50 hover:shadow-lg">
          <span className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-full bg-secondary text-primary"><Inbox className="size-5" /></span>{newMessages > 0 && <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-900 dark:bg-pink-950 dark:text-pink-200">{newMessages} nueva{newMessages === 1 ? "" : "s"}</span>}</span>
          <span><span className="block font-display text-3xl font-semibold">Consultas</span><span className="mt-2 block text-sm leading-6 text-muted-foreground">Lee y organiza los mensajes del formulario.</span><span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-teal">Ver bandeja <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span></span>
        </Link>
        <Link href="/admin/torneos/nuevo" className="pdh-panel group flex min-h-52 flex-col justify-between p-6 transition hover:-translate-y-1 hover:border-copper/50 hover:shadow-lg">
          <span className="grid size-11 place-items-center rounded-full bg-[#1b1025] text-[#f3a8d2]"><Plus className="size-5" /></span>
          <span><span className="block font-display text-3xl font-semibold">Nuevo torneo</span><span className="mt-2 block text-sm leading-6 text-muted-foreground">Crea el código y abre la inscripción de mazos.</span><span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-teal">Crear torneo <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span></span>
        </Link>
      </div>

      <div className="mt-14 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="pdh-kicker">Juego organizado</p><h2 className="mt-4 text-4xl leading-none">Torneos</h2></div>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">El flujo de torneos, jugadores, listas y standings se mantiene disponible.</p>
      </div>

      <div className="mt-7 grid gap-4">
        {tournaments.length ? tournaments.map((tournament) => (
          <Link href={`/admin/torneos/${tournament.id}`} key={tournament.id} className="pdh-panel group grid gap-5 p-6 transition hover:-translate-y-0.5 hover:border-copper/50 sm:grid-cols-[1fr_auto] sm:items-center">
            <div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase">{tournament.format_code}</span><span className="rounded-full border border-foreground/10 px-3 py-1 text-xs font-bold uppercase">{tournament.status}</span><span className="px-1 py-1 text-xs font-bold text-muted-foreground">{tournament.code}</span></div><h3 className="mt-3 text-3xl">{tournament.name}</h3><p className="mt-2 text-sm text-muted-foreground">{formatChileDate(tournament.starts_at)}</p></div>
            <span className="inline-flex items-center gap-2 text-sm font-bold text-teal">Administrar <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
          </Link>
        )) : <div className="pdh-panel flex min-h-72 flex-col items-center justify-center p-8 text-center"><ClipboardList className="size-9 text-copper" /><h3 className="mt-5 text-3xl">Crea el primer torneo.</h3><p className="mt-2 text-sm text-muted-foreground">El código y el enlace de inscripción se generan automáticamente.</p><Link href="/admin/torneos/nuevo" className="pdh-button-primary mt-6">Comenzar</Link></div>}
      </div>
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><Users className="size-4" /> Las listas de jugadores permanecen privadas y solo son visibles desde este panel.</div>
    </section>
  );
}
