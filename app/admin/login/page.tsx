import { KeyRound } from "lucide-react";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth/admin";
import { loginAction } from "@/app/admin/login/actions";

export const metadata = { title: "Acceso de administración" };

const errors: Record<string, string> = {
  datos: "Ingresa un email y una contraseña de al menos 8 caracteres.",
  credenciales: "No pudimos iniciar sesión con esos datos.",
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAdminUser()) redirect("/admin");
  const { error } = await searchParams;
  return (
    <section className="pdh-container grid min-h-[70vh] place-items-center py-16">
      <div className="pdh-panel w-full max-w-md p-7 sm:p-9">
        <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground"><KeyRound className="size-5" /></span>
        <p className="pdh-kicker mt-7">Área privada</p>
        <h1 className="mt-4 text-4xl leading-none">Administrar la Posada</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Crea torneos, revisa listas y prepara los resultados para publicación.</p>
        {error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">{errors[error] ?? "Ocurrió un problema al ingresar."}</p>}
        <form action={loginAction} className="mt-6 grid gap-4">
          <label className="grid gap-2"><span className="pdh-label">Email</span><input name="email" type="email" required className="pdh-input" autoComplete="email" /></label>
          <label className="grid gap-2"><span className="pdh-label">Contraseña</span><input name="password" type="password" minLength={8} required className="pdh-input" autoComplete="current-password" /></label>
          <button className="pdh-button-primary mt-2">Ingresar</button>
        </form>
        <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">Solo el usuario autorizado en la configuración privada puede acceder al panel.</p>
      </div>
    </section>
  );
}
