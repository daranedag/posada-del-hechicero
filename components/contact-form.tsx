"use client";

import { useActionState, useEffect, useRef } from "react";
import { LoaderCircle, Send } from "lucide-react";
import {
  submitContactAction,
  type ContactFormState,
} from "@/app/contact-actions";

const initialState: ContactFormState = { status: "idle", message: "" };

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-xs font-semibold text-red-700 dark:text-red-300">{messages[0]}</p>;
}

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="pdh-panel grid gap-5 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="pdh-label" htmlFor="contact-name">Nombre</label>
          <input
            className="pdh-input mt-2"
            id="contact-name"
            name="name"
            autoComplete="name"
            maxLength={120}
            required
          />
          <FieldError messages={state.errors?.name} />
        </div>
        <div>
          <label className="pdh-label" htmlFor="contact-email">Correo</label>
          <input
            className="pdh-input mt-2"
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
          />
          <FieldError messages={state.errors?.email} />
        </div>
      </div>

      <div>
        <label className="pdh-label" htmlFor="contact-subject">Asunto</label>
        <input
          className="pdh-input mt-2"
          id="contact-subject"
          name="subject"
          maxLength={160}
          placeholder="Ej. Consulta por un juego"
          required
        />
        <FieldError messages={state.errors?.subject} />
      </div>

      <div>
        <label className="pdh-label" htmlFor="contact-message">Mensaje</label>
        <textarea
          className="mt-2 min-h-36 w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
          id="contact-message"
          name="message"
          maxLength={4000}
          placeholder="Cuéntanos en qué podemos ayudarte..."
          required
        />
        <FieldError messages={state.errors?.message} />
      </div>

      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="contact-website">Sitio web</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={`text-sm ${state.status === "success" ? "font-semibold text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}
          aria-live="polite"
        >
          {state.message}
        </p>
        <button className="pdh-button-primary shrink-0" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
          {pending ? "Enviando..." : "Enviar consulta"}
        </button>
      </div>
    </form>
  );
}
