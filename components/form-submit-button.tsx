"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useFormStatus } from "react-dom";

export function FormSubmitButton({ label = "Guardar", className = "" }: { label?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className={`pdh-button-primary h-9 px-4 disabled:opacity-50 ${className}`}>
      {pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
      {pending ? "Guardando..." : label}
    </button>
  );
}
