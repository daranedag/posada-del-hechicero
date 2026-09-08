"use client";

import type { ButtonHTMLAttributes } from "react";
import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function AdminDeleteButton({
  label = "Eliminar",
  confirmationMessage = "¿Confirmas que quieres eliminar este contenido?",
  formAction,
  name,
  value,
}: {
  label?: string;
  confirmationMessage?: string;
  formAction?: ButtonHTMLAttributes<HTMLButtonElement>["formAction"];
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      formAction={formAction}
      formNoValidate
      name={name}
      value={value}
      onClick={(event) => {
        if (!window.confirm(confirmationMessage)) event.preventDefault();
      }}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-red-300/70 px-4 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
    >
      <Trash2 className="size-3.5" /> {pending ? "Eliminando..." : label}
    </button>
  );
}
