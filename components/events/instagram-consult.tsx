"use client";

import { useState } from "react";
import { ArrowUpRight, Copy } from "lucide-react";
import { instagramChatUrl } from "@/lib/contact";
import { dayLabel, eventTime } from "@/lib/events/calendar";

const instagram = instagramChatUrl(process.env.NEXT_PUBLIC_INSTAGRAM_URL);
export function InstagramConsult({ title, date, startsAt }: { title: string; date: string; startsAt: string }) {
  const [status, setStatus] = useState("");
  const message = `Hola, quisiera consultar por ${title} del ${dayLabel(date)} a las ${eventTime(startsAt)}.`;
  async function consult() {
    let copying: Promise<void>;
    try { copying = navigator.clipboard.writeText(message); }
    catch { copying = Promise.reject(new Error("Clipboard unavailable")); }
    window.open(instagram, "_blank", "noopener,noreferrer");
    try { await copying; setStatus("Mensaje copiado. Pégalo en Instagram y pulsa enviar."); }
    catch { setStatus("Copia el mensaje de abajo y pégalo en Instagram para enviarlo."); }
  }
  return <div className="grid gap-3">
    <button type="button" className="pdh-button-primary w-fit" onClick={consult}><Copy className="size-4" /> Consultar por Instagram</button>
    <p role="status" className="text-sm">{status}</p>
    {status && <div className="grid gap-2">
      <textarea aria-label="Mensaje para Instagram" className="pdh-input min-h-24 w-full" readOnly value={message} onFocus={event => event.currentTarget.select()} />
      <a href={instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-teal">Abrir Instagram <ArrowUpRight className="size-4" /></a>
    </div>}
  </div>;
}
