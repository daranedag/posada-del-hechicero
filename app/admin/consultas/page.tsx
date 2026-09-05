import { Archive, Mail, MessageSquareText } from "lucide-react";
import { AdminDeleteButton } from "@/components/admin-delete-button";
import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { formatChileDate } from "@/lib/dates";
import { adminInsforge } from "@/lib/insforge/admin";
import type { ContactSubmission } from "@/lib/types";
import {
  deleteContactSubmissionAction,
  updateContactStatusAction,
} from "@/app/admin/consultas/actions";

export const metadata = { title: "Consultas recibidas" };
export const dynamic = "force-dynamic";

const statusLabels: Record<ContactSubmission["status"], string> = {
  new: "Nueva",
  read: "Leída",
  archived: "Archivada",
};

export default async function ContactSubmissionsPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const user = await requireAdmin();
  const { data } = await adminInsforge.database
    .from("pdh_contact_submissions")
    .select("id,name,email,subject,message,status,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const submissions = (data ?? []) as ContactSubmission[];
  const { estado } = await searchParams;

  return (
    <section className="pdh-container py-10 sm:py-14">
      <AdminNav name={(user.admin as { display_name?: string }).display_name ?? user.email} />
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="pdh-kicker">Bandeja de entrada</p><h1 className="mt-4 text-5xl leading-none">Consultas recibidas</h1></div>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">Mensajes enviados desde el formulario público de la portada.</p>
      </div>

      {estado && <p className={`mt-6 rounded-lg border p-3 text-sm font-semibold ${estado === "error" ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200" : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"}`}>{estado === "error" ? "No pudimos completar el cambio." : estado === "eliminado" ? "La consulta fue eliminada." : "El estado fue actualizado."}</p>}

      <div className="mt-8 grid gap-4">
        {submissions.length ? submissions.map((submission) => (
          <article key={submission.id} className={`pdh-panel p-5 sm:p-6 ${submission.status === "new" ? "border-copper/45" : ""}`}>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${submission.status === "new" ? "bg-pink-100 text-pink-900 dark:bg-pink-950 dark:text-pink-200" : "bg-muted text-muted-foreground"}`}>{statusLabels[submission.status]}</span>
                  <span className="text-xs text-muted-foreground">{formatChileDate(submission.created_at)}</span>
                </div>
                <h2 className="mt-3 text-2xl">{submission.subject}</h2>
                <p className="mt-1 text-sm font-bold">{submission.name}</p>
                <a href={`mailto:${submission.email}`} className="mt-1 inline-flex items-center gap-2 text-sm text-teal hover:underline"><Mail className="size-3.5" /> {submission.email}</a>
              </div>
              <form action={updateContactStatusAction} className="flex shrink-0 gap-2">
                <input type="hidden" name="id" value={submission.id} />
                <select name="status" defaultValue={submission.status} className="h-9 rounded-lg border border-input bg-background px-3 text-sm font-semibold">
                  <option value="new">Nueva</option><option value="read">Leída</option><option value="archived">Archivada</option>
                </select>
                <button className="pdh-button-secondary h-9 px-4 text-xs">Actualizar</button>
              </form>
            </div>
            <p className="mt-5 whitespace-pre-wrap rounded-xl bg-secondary/55 p-4 text-sm leading-7">{submission.message}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <a href={`mailto:${submission.email}?subject=${encodeURIComponent(`Re: ${submission.subject}`)}`} className="pdh-button-primary h-9 px-4 text-xs"><Mail className="size-3.5" /> Responder por correo</a>
              <form action={deleteContactSubmissionAction}><input type="hidden" name="id" value={submission.id} /><AdminDeleteButton label="Eliminar consulta" /></form>
            </div>
          </article>
        )) : (
          <div className="pdh-panel flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <MessageSquareText className="size-10 text-copper" />
            <h2 className="mt-5 text-3xl">Aún no hay consultas.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Los mensajes nuevos aparecerán aquí.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground"><Archive className="size-3.5" /> Se muestran hasta 200 mensajes.</span>
          </div>
        )}
      </div>
    </section>
  );
}
