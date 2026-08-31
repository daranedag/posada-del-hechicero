import Link from "next/link";
import { Clipboard, Download, ExternalLink, Save, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { saveStandingsAction, updateTournamentStatusAction } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { formatChileDate } from "@/lib/dates";
import { adminInsforge } from "@/lib/insforge/admin";
import type { Tournament } from "@/lib/types";

export const dynamic = "force-dynamic";

type Player = { id: string; first_name: string; last_name: string; email: string | null; created_at: string };
type Submission = { id: string; player_id: string; version_number: number; main_count: number; sideboard_count: number; submitted_at: string };
type Standing = { player_id: string; rank: number; match_points: number; wins: number; losses: number; draws: number };

export default async function TournamentAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const { id } = await params;
  const [tournamentResult, playersResult, submissionsResult, standingsResult] = await Promise.all([
    adminInsforge.database.from("pdh_tournaments").select("id,code,name,format_code,starts_at,submission_deadline,location,max_players,public_notes,status").eq("id", id).maybeSingle(),
    adminInsforge.database.from("pdh_players").select("id,first_name,last_name,email,created_at").eq("tournament_id", id).order("last_name", { ascending: true }),
    adminInsforge.database.from("pdh_deck_submissions").select("id,player_id,version_number,main_count,sideboard_count,submitted_at").eq("tournament_id", id).eq("is_current", true),
    adminInsforge.database.from("pdh_standings").select("player_id,rank,match_points,wins,losses,draws").eq("tournament_id", id),
  ]);
  if (!tournamentResult.data) notFound();
  const tournament = tournamentResult.data as Tournament;
  const players = (playersResult.data ?? []) as Player[];
  const submissions = new Map(((submissionsResult.data ?? []) as Submission[]).map((item) => [item.player_id, item]));
  const standings = new Map(((standingsResult.data ?? []) as Standing[]).map((item) => [item.player_id, item]));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const shareUrl = `${appUrl}/torneos/${tournament.code}`;
  return (
    <section className="pdh-container py-10 sm:py-14">
      <AdminNav name={(user.admin as { display_name?: string }).display_name ?? user.email} />
      <div className="rounded-[1.25rem] bg-[#142821] p-7 text-[#f6ecda] sm:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e4a274]">{tournament.format_code} · {tournament.status}</p><h1 className="mt-3 text-4xl leading-none sm:text-5xl">{tournament.name}</h1><p className="mt-4 text-sm text-white/60">{formatChileDate(tournament.starts_at)} · Cierre {formatChileDate(tournament.submission_deadline)}</p></div><form action={updateTournamentStatusAction} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={id} /><select name="status" defaultValue={tournament.status} className="h-10 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-bold text-white"><option className="text-black" value="open">Abierto</option><option className="text-black" value="locked">Bloqueado</option><option className="text-black" value="completed">Finalizado</option><option className="text-black" value="cancelled">Cancelado</option></select><button className="h-10 rounded-full bg-[#d07b43] px-5 text-sm font-bold">Actualizar</button></form></div>
        <div className="mt-7 flex flex-col gap-2 rounded-xl border border-white/10 bg-black/15 p-4 sm:flex-row sm:items-center"><input readOnly value={shareUrl} className="min-w-0 flex-1 bg-transparent text-sm text-white/75 outline-none" /><Link href={`/torneos/${tournament.code}`} target="_blank" className="inline-flex items-center gap-2 text-sm font-bold text-[#efb17d]">Abrir <ExternalLink className="size-4" /></Link><span className="hidden items-center gap-2 text-sm font-bold text-white/45 sm:inline-flex"><Clipboard className="size-4" /> Código {tournament.code}</span></div>
      </div>

      <div className="mt-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="pdh-kicker"><Users className="size-4" /> Participantes</p><h2 className="mt-3 text-4xl">{players.length} inscritos</h2></div><a href={`/api/admin/tournaments/${id}/export`} className="pdh-button-primary"><Download className="size-4" /> Exportar MTGTop8</a></div>
      <form action={saveStandingsAction} className="pdh-panel mt-6 overflow-hidden"><input type="hidden" name="tournamentId" value={id} /><div className="overflow-x-auto"><table className="w-full min-w-[880px] text-sm"><thead className="bg-secondary/70 text-left text-xs uppercase tracking-[0.1em]"><tr><th className="p-4">Jugador</th><th className="p-4">Lista</th><th className="p-4">Puesto</th><th className="p-4">Pts</th><th className="p-4">G</th><th className="p-4">P</th><th className="p-4">E</th></tr></thead><tbody>
        {players.map((player) => { const submission = submissions.get(player.id); const standing = standings.get(player.id); return <tr key={player.id} className="border-t border-foreground/10"><td className="p-4"><input type="hidden" name="playerId" value={player.id} /><Link href={`/admin/torneos/${id}/jugadores/${player.id}`} className="font-bold underline decoration-copper/40 underline-offset-4 hover:text-teal">{player.first_name} {player.last_name}</Link><p className="mt-1 text-xs text-muted-foreground">{player.email ?? "Sin email"}</p></td><td className="p-4">{submission ? <Link href={`/admin/torneos/${id}/jugadores/${player.id}`} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">v{submission.version_number} · {submission.main_count}+{submission.sideboard_count}</Link> : <span className="text-xs text-red-700">Sin lista</span>}</td>{[["rank", standing?.rank], ["points", standing?.match_points], ["wins", standing?.wins], ["losses", standing?.losses], ["draws", standing?.draws]].map(([field, value]) => <td key={String(field)} className="p-4"><input name={`${field}:${player.id}`} type="number" min="0" defaultValue={value ?? ""} className="h-9 w-20 rounded-md border border-input bg-background px-2" /></td>)}</tr>; })}
        {!players.length && <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">Aún no hay participantes.</td></tr>}
      </tbody></table></div>{players.length > 0 && <div className="flex justify-end border-t border-foreground/10 p-4"><button className="pdh-button-primary"><Save className="size-4" /> Guardar standings</button></div>}</form>
    </section>
  );
}
