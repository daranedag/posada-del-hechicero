import { KeyRound, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { getAdminUser, hasConfiguredAdminEmails } from "@/lib/auth/admin";
import { loginWithGoogleAction } from "@/app/admin/login/actions";

export const metadata = { title: "Acceso de administración" };

const errors: Record<string, string> = {
  configuracion: "Aún falta configurar la conexión de acceso del sitio.",
  oauth_inicio: "No pudimos abrir el acceso con Google. Inténtalo nuevamente.",
  oauth_callback: "Google no pudo completar el acceso. Inténtalo nuevamente.",
  no_autorizado: "Esta cuenta de Google no tiene permiso para administrar el sitio.",
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAdminUser()) redirect("/admin");
  const { error } = await searchParams;
  const isConfigured = hasConfiguredAdminEmails();
  return (
    <section className="pdh-container grid min-h-[70vh] place-items-center py-16">
      <div className="pdh-panel w-full max-w-md p-7 sm:p-9">
        <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground"><KeyRound className="size-5" /></span>
        <p className="pdh-kicker mt-7">Área privada</p>
        <h1 className="mt-4 text-4xl leading-none">Administrar la Posada</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Crea torneos, revisa listas y prepara los resultados para publicación.</p>
        {error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">{errors[error] ?? "Ocurrió un problema al ingresar."}</p>}
        {!isConfigured && <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Configura al menos un correo en <code>PDH_ADMIN_EMAILS</code> para habilitar el panel.</p>}
        <form action={loginWithGoogleAction} className="mt-6">
          <button disabled={!isConfigured} className="pdh-button-secondary w-full disabled:pointer-events-none disabled:opacity-50">
            <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-white font-bold text-[#4285f4] shadow-sm">G</span>
            Continuar con Google
          </button>
        </form>
        <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs leading-5 text-muted-foreground"><ShieldCheck className="size-4 text-copper" /> Solo las cuentas autorizadas en la configuración privada pueden acceder.</p>
      </div>
    </section>
  );
}
