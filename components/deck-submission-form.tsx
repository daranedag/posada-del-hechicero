"use client";

import { useState } from "react";
import { CheckCircle2, Clipboard, LoaderCircle, ShieldAlert } from "lucide-react";

type Validation = { errors?: string[]; warnings?: string[]; mainCount?: number; sideboardCount?: number };

export function DeckSubmissionForm({
  code,
  defaults,
}: {
  code: string;
  defaults?: { firstName: string; lastName: string; email: string; source: string; deckList: string; editToken: string };
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [result, setResult] = useState<{ version: number; editUrl: string; mainCount: number; sideboardCount: number } | null>(null);

  async function submit(formData: FormData) {
    setLoading(true);
    setError(null);
    setValidation(null);
    const response = await fetch(`/api/tournaments/${code}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        source: formData.get("source"),
        deckList: formData.get("deckList"),
        editToken: defaults?.editToken,
      }),
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "No pudimos guardar la lista.");
      setValidation(payload.validation ?? null);
      return;
    }
    setResult({ version: payload.version, editUrl: payload.editUrl, mainCount: payload.validation.mainCount, sideboardCount: payload.validation.sideboardCount });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (result) {
    return (
      <div className="pdh-panel p-7 sm:p-10">
        <span className="grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-800"><CheckCircle2 className="size-6" /></span>
        <h2 className="mt-6 text-4xl">Lista #{result.version} recibida.</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Validamos {result.mainCount} cartas en el mazo principal y {result.sideboardCount} en el sideboard.</p>
        <div className="mt-7 rounded-xl border border-copper/30 bg-secondary/60 p-5">
          <p className="text-sm font-bold">Guarda este enlace privado</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Te permite reemplazar tu lista hasta el cierre de inscripciones. No lo compartas con otros jugadores.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input readOnly value={result.editUrl} className="pdh-input min-w-0 flex-1" />
            <button type="button" onClick={() => navigator.clipboard.writeText(result.editUrl)} className="pdh-button-secondary"><Clipboard className="size-4" /> Copiar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={submit} className="pdh-panel p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2"><span className="pdh-label">Nombre</span><input name="firstName" required maxLength={80} defaultValue={defaults?.firstName} className="pdh-input" autoComplete="given-name" /></label>
        <label className="grid gap-2"><span className="pdh-label">Apellido</span><input name="lastName" required maxLength={120} defaultValue={defaults?.lastName} className="pdh-input" autoComplete="family-name" /></label>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2"><span className="pdh-label">Email <span className="font-normal text-muted-foreground">(opcional)</span></span><input name="email" type="email" defaultValue={defaults?.email} className="pdh-input" autoComplete="email" /></label>
        <label className="grid gap-2"><span className="pdh-label">Origen de la lista</span><select name="source" defaultValue={defaults?.source ?? "moxfield"} className="pdh-input"><option value="moxfield">Moxfield</option><option value="manabox">ManaBox</option><option value="arena">MTG Arena</option><option value="mtgo">MTGO / MTGTop8</option><option value="plain-text">Texto simple</option><option value="other">Otro</option></select></label>
      </div>
      <label className="mt-5 grid gap-2">
        <span className="pdh-label">Decklist</span>
        <textarea name="deckList" required minLength={20} maxLength={100000} defaultValue={defaults?.deckList} className="min-h-[380px] w-full rounded-xl border border-input bg-background p-4 font-mono text-sm leading-6 outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20" placeholder={"Deck\n4 Opt (XLN) 65\n4 Consider\n...\n\nSideboard\n2 Negate\n..."} />
      </label>

      {error && (
        <div className="mt-5 rounded-xl border border-red-300 bg-red-50 p-5 text-red-950">
          <p className="flex items-center gap-2 font-bold"><ShieldAlert className="size-5" /> {error}</p>
          {!!validation?.errors?.length && <ul className="mt-3 grid gap-2 pl-5 text-sm leading-5">{validation.errors.map((item) => <li key={item} className="list-disc">{item}</li>)}</ul>}
        </div>
      )}

      <div className="mt-6 flex flex-col justify-between gap-4 border-t border-foreground/10 pt-6 sm:flex-row sm:items-center">
        <p className="max-w-lg text-xs leading-5 text-muted-foreground">Al enviar, la lista se contrasta carta por carta con Scryfall y las reglas del formato. Una lista ilegal no se guarda.</p>
        <button disabled={loading} className="pdh-button-primary shrink-0 disabled:cursor-wait disabled:opacity-60">{loading ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}{loading ? "Validando..." : defaults ? "Guardar nueva version" : "Validar e inscribir"}</button>
      </div>
    </form>
  );
}
