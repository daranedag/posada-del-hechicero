import Link from "next/link";
import { Globe2, Inbox, LogOut, Plus, Settings2 } from "lucide-react";
import { logoutAction } from "@/app/admin/login/actions";

export function AdminNav({ name }: { name: string }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 rounded-xl border border-foreground/10 bg-card p-4 sm:flex-row sm:items-center">
      <Link href="/admin" className="flex items-center gap-3 font-bold"><span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"><Settings2 className="size-4" /></span>Panel · {name}</Link>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/sitio" className="pdh-button-secondary h-9 px-4"><Globe2 className="size-4" /> Sitio</Link>
        <Link href="/admin/consultas" className="pdh-button-secondary h-9 px-4"><Inbox className="size-4" /> Consultas</Link>
        <Link href="/admin/torneos/nuevo" className="pdh-button-primary h-9 px-4"><Plus className="size-4" /> Nuevo torneo</Link>
        <form action={logoutAction}><button className="pdh-button-secondary h-9 px-4"><LogOut className="size-4" /> Salir</button></form>
      </div>
    </div>
  );
}
