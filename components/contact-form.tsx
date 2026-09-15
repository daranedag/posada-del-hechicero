"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Copy, LoaderCircle } from "lucide-react";
import { instagramChatUrl } from "@/lib/contact";

const instagram = instagramChatUrl(process.env.NEXT_PUBLIC_INSTAGRAM_URL);

export function ContactForm() {
  const [preparedMessage, setPreparedMessage] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const attempt = useRef(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    for (const field of Array.from(form.elements)) {
      if (field instanceof HTMLInputElement || (field instanceof HTMLTextAreaElement && !field.readOnly)) {
        field.value = field.value.trim();
        field.setCustomValidity(field.value.length < field.minLength ? `Escribe al menos ${field.minLength} caracteres.` : "");
      }
    }
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const message = `Hola, soy ${data.get("name")}.\nConsulta: ${data.get("subject")}\n\n${data.get("message")}`;
    const currentAttempt = ++attempt.current;
    setPreparedMessage(message);
    setPending(true);
    setStatus("Preparando tu mensaje…");

    // Start copying and open the chat during the click gesture, before awaiting.
    // The explicit link below also works when a browser blocks the new tab.
    let copying: Promise<void>;
    try {
      copying = navigator.clipboard.writeText(message);
    } catch {
      copying = Promise.reject(new Error("Clipboard unavailable"));
    }
    window.open(instagram, "_blank", "noopener,noreferrer");

    try {
      await copying;
      if (attempt.current === currentAttempt) {
        setStatus("Mensaje copiado. Pégalo en el chat de Instagram y pulsa enviar. Si el chat no se abrió, usa el enlace de abajo.");
      }
    } catch {
      if (attempt.current === currentAttempt) {
        setStatus("No pudimos copiar automáticamente. Selecciona y copia el texto de abajo, abre Instagram y pégalo en el chat para enviarlo.");
      }
    } finally {
      if (attempt.current === currentAttempt) setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={(event) => {
        const field = event.target;
        if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) field.setCustomValidity("");
        attempt.current++;
        setPreparedMessage("");
        setStatus("");
        setPending(false);
      }}
      className="pdh-panel grid gap-5 p-6 sm:p-8"
    >
      <div>
        <label className="pdh-label" htmlFor="contact-name">Nombre</label>
        <input className="pdh-input mt-2" id="contact-name" name="name" autoComplete="name" minLength={2} maxLength={120} required />
      </div>
      <div>
        <label className="pdh-label" htmlFor="contact-subject">Asunto</label>
        <input className="pdh-input mt-2" id="contact-subject" name="subject" minLength={2} maxLength={160} placeholder="Ej. Consulta por un juego" required />
      </div>
      <div>
        <label className="pdh-label" htmlFor="contact-message">Mensaje</label>
        <textarea className="mt-2 min-h-36 w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20" id="contact-message" name="message" minLength={10} maxLength={4000} placeholder="Cuéntanos en qué podemos ayudarte..." required />
      </div>
      <p className="text-sm leading-6 text-muted-foreground" id="contact-instructions">
        Copiaremos tu consulta y abriremos Instagram. Pega el mensaje en el chat y pulsa enviar; te responderemos por allí.
      </p>
      <button type="submit" className="pdh-button-primary w-full whitespace-normal" disabled={pending} aria-describedby="contact-instructions">
        {pending ? <LoaderCircle className="size-4 shrink-0 animate-spin" /> : <Copy className="size-4 shrink-0" />}
        {pending ? "Copiando…" : "Copiar mensaje y abrir Instagram"}
      </button>
      <p className="text-sm leading-6" role="status">{status}</p>
      {preparedMessage && (
        <div className="grid gap-3">
          <label className="pdh-label" htmlFor="contact-prepared">Tu mensaje para Instagram</label>
          <textarea id="contact-prepared" className="pdh-input min-h-40 w-full" value={preparedMessage} readOnly onFocus={(event) => event.currentTarget.select()} />
          <p className="text-xs text-muted-foreground">La consulta se enviará cuando pulses enviar en Instagram.</p>
        </div>
      )}
      <a href={instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-teal hover:underline">
        Abrir chat de Instagram <ArrowUpRight className="size-4" />
      </a>
    </form>
  );
}
