"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function AdminDeleteButton({ label = "Eliminar" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm("¿Confirmas que quieres eliminar este contenido?")) event.preventDefault();
      }}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-red-300/70 px-4 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
    >
      <Trash2 className="size-3.5" /> {pending ? "Eliminando..." : label}
    </button>
  );
}
