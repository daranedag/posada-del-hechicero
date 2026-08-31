import Link from "next/link";
import { ArrowRight, ClipboardList, Users } from "lucide-react";
import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { formatChileDate } from "@/lib/dates";
import { adminInsforge } from "@/lib/insforge/admin";
import type { Tournament } from "@/lib/types";

export const metadata = { title: "Administración" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdmin();
  const { data } = await adminInsforge.database.from("pdh_tournaments").select("id,code,name,format_code,starts_at,submission_deadline,location,max_players,public_notes,status").order("starts_at", { ascending: false }).limit(50);
  const tournaments = (data ?? []) as Tournament[];
  return (
    <section className="pdh-container py-10 sm:py-14">
      <AdminNav name={(user.admin as { display_name?: string }).display_name ?? user.email} />
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="pdh-kicker">Juego organizado</p><h1 className="mt-4 text-5xl leading-none">Torneos</h1></div><p className="max-w-md text-sm leading-6 text-muted-foreground">Crea el enlace, recibe versiones legales, completa standings y exporta el paquete del evento.</p></div>
      <div className="mt-9 grid gap-4">
        {tournaments.length ? tournaments.map((tournament) => (
          <Link href={`/admin/torneos/${tournament.id}`} key={tournament.id} className="pdh-panel group grid gap-5 p-6 transition hover:-translate-y-0.5 hover:border-copper/50 sm:grid-cols-[1fr_auto] sm:items-center">
            <div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase">{tournament.format_code}</span><span className="rounded-full border border-foreground/10 px-3 py-1 text-xs font-bold uppercase">{tournament.status}</span><span className="px-1 py-1 text-xs font-bold text-muted-foreground">{tournament.code}</span></div><h2 className="mt-3 text-3xl">{tournament.name}</h2><p className="mt-2 text-sm text-muted-foreground">{formatChileDate(tournament.starts_at)}</p></div>
            <span className="inline-flex items-center gap-2 text-sm font-bold text-teal">Administrar <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
          </Link>
        )) : <div className="pdh-panel flex min-h-72 flex-col items-center justify-center p-8 text-center"><ClipboardList className="size-9 text-copper" /><h2 className="mt-5 text-3xl">Crea el primer torneo.</h2><p className="mt-2 text-sm text-muted-foreground">El código y el enlace de inscripción se generan automáticamente.</p><Link href="/admin/torneos/nuevo" className="pdh-button-primary mt-6">Comenzar</Link></div>}
      </div>
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><Users className="size-4" /> Las listas de jugadores permanecen privadas y solo son visibles desde este panel.</div>
    </section>
  );
}
