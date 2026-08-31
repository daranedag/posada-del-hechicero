import { AdminNav } from "@/components/admin-nav";
import { createTournamentAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata = { title: "Crear torneo" };

const errors: Record<string, string> = { datos: "Revisa los datos obligatorios.", fecha: "El cierre de listas no puede ser posterior al inicio del torneo.", guardar: "No pudimos crear el torneo." };

export default async function NewTournamentPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireAdmin();
  const { error } = await searchParams;
  return (
    <section className="pdh-container py-10 sm:py-14">
      <AdminNav name={(user.admin as { display_name?: string }).display_name ?? user.email} />
      <div className="mx-auto max-w-3xl"><p className="pdh-kicker">Nuevo evento competitivo</p><h1 className="mt-4 text-5xl leading-none">Crear torneo</h1><p className="mt-4 text-sm leading-6 text-muted-foreground">Al guardarlo quedará abierto y recibirás un código único para compartir.</p>
        {error && <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">{errors[error] ?? errors.guardar}</p>}
        <form action={createTournamentAction} className="pdh-panel mt-8 grid gap-5 p-6 sm:p-8">
          <label className="grid gap-2"><span className="pdh-label">Nombre del torneo</span><input name="name" required maxLength={180} className="pdh-input" placeholder="RCQ La Posada · Standard" /></label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2"><span className="pdh-label">Formato</span><select name="formatCode" className="pdh-input"><option value="standard">Standard</option><option value="pioneer">Pioneer</option><option value="modern">Modern</option><option value="pauper">Pauper</option></select></label>
            <label className="grid gap-2"><span className="pdh-label">Cupo máximo <span className="font-normal text-muted-foreground">(opcional)</span></span><input name="maxPlayers" type="number" min="2" max="1000" className="pdh-input" placeholder="40" /></label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2"><span className="pdh-label">Inicio del torneo</span><input name="startsAt" type="datetime-local" required className="pdh-input" /></label>
            <label className="grid gap-2"><span className="pdh-label">Cierre de listas</span><input name="deadline" type="datetime-local" required className="pdh-input" /></label>
          </div>
          <label className="grid gap-2"><span className="pdh-label">Lugar</span><input name="location" required defaultValue="La Posada del Hechicero, Aníbal Pinto 1843 Local 3, Valdivia" className="pdh-input" /></label>
          <label className="grid gap-2"><span className="pdh-label">Indicaciones públicas <span className="font-normal text-muted-foreground">(opcional)</span></span><textarea name="notes" maxLength={3000} className="min-h-28 w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" placeholder="Hora de llegada, requisitos, contacto..." /></label>
          <button className="pdh-button-primary mt-2">Crear y abrir inscripciones</button>
        </form>
      </div>
    </section>
  );
}
