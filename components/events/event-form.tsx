"use client";

import Link from "next/link";
import { useActionState, useState, type ChangeEvent } from "react";
import { ImageKitPicker } from "@/components/imagekit-picker";
import { saveEventAction, type EventFormState } from "@/app/admin/eventos/actions";
import { addDays, chileLocal, eventTypeLabels, weekdays, type CalendarEvent, type EventOccurrence } from "@/lib/events/calendar";

export function EventForm({ event, occurrence, date, duplicateId }: { event?: CalendarEvent; occurrence?: EventOccurrence; date: string; duplicateId?: string }) {
  const editing = !!event && !duplicateId;
  const recurring = editing && !!event.recurrence_days?.length;
  const source = occurrence ?? event;
  const [scope, setScope] = useState(recurring ? "occurrence" : editing ? "update" : "create");
  const [repetition, setRepetition] = useState(event?.recurrence_days?.length ? "weekly" : "once");
  const [startDate, setStartDate] = useState(date);
  const [endDate, setEndDate] = useState(source?.ends_at && chileLocal(source.ends_at).slice(0, 10) > chileLocal(source.starts_at).slice(0, 10) ? addDays(date, 1) : date);
  const [publication, setPublication] = useState(duplicateId ? "draft" : source?.status === "draft" && !recurring ? "draft" : source?.status === "cancelled" || occurrence?.cancelled ? "cancelled" : "published");
  const [state, action, pending] = useActionState<EventFormState, FormData>(saveEventAction, { message: "" });
  const singleDate = scope === "occurrence";
  // Controlled fields retain the user's work when validation or the network fails.
  const [values, setValues] = useState({
    title: duplicateId ? `${source?.title ?? "Evento"} (copia)` : source?.title ?? "",
    event_type: source?.event_type ?? "community", format_label: source?.format_label ?? "",
    description: source?.description ?? "", location: source?.location ?? "Aníbal Pinto 1843, Local 3, Valdivia",
    start_time: source ? chileLocal(source.starts_at).slice(11) : "18:00",
    end_time: source?.ends_at ? chileLocal(source.ends_at).slice(11) : "20:00",
    until: duplicateId ? "" : event?.recurrence_until ?? "",
  });
  const [days, setDays] = useState(event?.recurrence_days ?? [new Date(`${date}T12:00:00Z`).getUTCDay()]);
  function field(name: keyof typeof values) {
    return { value: values[name], onChange: (change: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setValues(previous => ({ ...previous, [name]: change.target.value })) };
  }
  function error(name: string) { return state.errors?.[name]?.map(message => <p key={message} className="text-sm text-red-700 dark:text-red-300">{message}</p>); }
  return <form action={action} className="pdh-panel mt-7 grid gap-6 p-5 sm:p-8">
    <input type="hidden" name="id" value={editing ? event.id : ""} />
    <input type="hidden" name="duplicate_id" value={duplicateId ?? ""} />
    <input type="hidden" name="duplicate_date" value={duplicateId ? occurrence?.occurrence_date ?? "" : ""} />
    <input type="hidden" name="updated_at" value={event?.updated_at ?? ""} />
    <input type="hidden" name="occurrence_date" value={date} />
    <input type="hidden" name="mode" value={scope} />
    <fieldset disabled={pending} className="grid min-w-0 gap-6">
      {recurring && <div className="rounded-xl bg-secondary p-4"><label className="pdh-label" htmlFor="edit-scope">¿Qué quieres modificar?</label><select id="edit-scope" className="pdh-input mt-2" value={scope} onChange={event => { setScope(event.target.value); if (event.target.value === "occurrence" && publication === "draft") setPublication("published"); }}><option value="occurrence">Solo esta fecha</option><option value="future">Esta fecha y las siguientes</option></select><p className="mt-2 text-sm">{singleDate ? "El resto de la programación semanal se mantiene. Puedes cambiar los detalles o cancelar únicamente esta sesión." : "Las fechas anteriores se conservan. Los cambios individuales de otras fechas se mantienen si siguen dentro de la nueva programación."}</p>{event.status === "draft" && <p className="mt-2 text-sm font-bold">Esta programación es un borrador. Para publicarla, elige «Esta fecha y las siguientes» y «Publicado».</p>}</div>}
      <label className="grid gap-2"><span className="pdh-label">Nombre del evento</span><input className="pdh-input" name="title" {...field("title")} required minLength={2} maxLength={160} placeholder="Ej. Viernes de Commander" />{error("title")}</label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2"><span className="pdh-label">Categoría</span><select className="pdh-input" name="event_type" {...field("event_type")}>{Object.entries(eventTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{error("event_type")}</label>
        <label className="grid gap-2"><span className="pdh-label">Formato o subtítulo <span className="font-normal">(opcional)</span></span><input className="pdh-input" name="format_label" maxLength={100} {...field("format_label")} placeholder="Ej. Commander casual" />{error("format_label")}</label>
      </div>
      <label className="grid gap-2"><span className="pdh-label">Descripción</span><textarea className="pdh-input min-h-36" name="description" maxLength={4000} {...field("description")} placeholder="Cuenta de qué se trata y qué deben traer los asistentes." />{error("description")}</label>
      <label className="grid gap-2"><span className="pdh-label">Ubicación</span><input className="pdh-input" name="location" required maxLength={300} {...field("location")} />{error("location")}</label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2"><span className="pdh-label">{repetition === "weekly" && !singleDate ? "Primera fecha de la programación" : "Fecha"}</span><input type="date" className="pdh-input" name="date" value={startDate} readOnly={recurring} required min="2000-01-01" max="2100-12-31" onChange={event => { const next = event.target.value; if (endDate === startDate) setEndDate(next); setStartDate(next); }} />{error("date")}</label>
        <label className="grid gap-2"><span className="pdh-label">Hora de inicio</span><input type="time" className="pdh-input" name="start_time" required {...field("start_time")} />{error("start_time")}</label>
        <label className="grid gap-2"><span className="pdh-label">Fecha de término</span><input type="date" className="pdh-input" name="end_date" required min={startDate} max={startDate ? addDays(startDate, 1) : undefined} value={endDate} onChange={event => setEndDate(event.target.value)} />{error("end_date")}</label>
        <label className="grid gap-2"><span className="pdh-label">Hora de término</span><input type="time" className="pdh-input" name="end_time" required {...field("end_time")} />{error("end_time")}</label>
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">Horarios de Chile. Si la actividad termina después de medianoche, elige el día siguiente.</p>
      {singleDate ? <><input type="hidden" name="repetition" value="once" /><input type="hidden" name="until" value="" /></> : <div className="grid gap-4 rounded-xl border border-input p-4">
        <label className="grid gap-2"><span className="pdh-label">Repetición</span><select className="pdh-input" name="repetition" value={repetition} onChange={event => setRepetition(event.target.value)}><option value="once">Una sola vez</option><option value="weekly">Repetir semanalmente</option></select></label>
        {repetition === "weekly" && <><fieldset><legend className="pdh-label mb-3">Días de la semana</legend><div className="flex flex-wrap gap-3">{[1, 2, 3, 4, 5, 6, 0].map(day => <label key={day} className="flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm"><input type="checkbox" name="days" value={day} checked={days.includes(day)} onChange={change => setDays(previous => change.target.checked ? [...previous, day] : previous.filter(value => value !== day))} />{weekdays[day]}</label>)}</div>{error("days")}</fieldset><label className="grid gap-2"><span className="pdh-label">Repetir hasta <span className="font-normal">(opcional)</span></span><input type="date" className="pdh-input" name="until" min={startDate} max="2100-12-31" {...field("until")} /><span className="text-xs text-muted-foreground">Déjalo vacío para continuar cada semana sin fecha de término.</span>{error("until")}</label></>}
        {repetition === "once" && <input type="hidden" name="until" value="" />}
      </div>}
      <div className="grid gap-3"><h2 className="text-2xl">Imagen opcional</h2><ImageKitPicker currentUrl={source?.image_url ?? ""} />{source?.image_url && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="remove_image" /> Quitar la imagen del evento</label>}</div>
      <label className="grid gap-2"><span className="pdh-label">Estado</span><select className="pdh-input" name="status" value={publication} onChange={event => setPublication(event.target.value)}>{!singleDate && <option value="draft">Borrador · solo visible en el panel</option>}<option value="published">Publicado · visible en el calendario</option><option value="cancelled">Cancelado</option></select>{error("status")}</label>
      {publication === "cancelled" && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{singleDate ? "Se mostrará esta sesión como cancelada. Las demás fechas continúan." : scope === "future" ? "Se cancelará esta fecha y toda la programación posterior. Las fechas anteriores se conservan." : "El evento dejará de aparecer en el calendario público y se conservará en el panel."}</p>}
    </fieldset>
    <p role="status" className="text-sm font-semibold text-red-700 dark:text-red-300">{state.message}</p>
    <div className="flex flex-wrap items-center gap-3"><button type="submit" disabled={pending} className="pdh-button-primary">{pending ? "Guardando…" : publication === "cancelled" ? "Guardar cancelación" : "Guardar evento"}</button><Link href="/admin/eventos" className="pdh-button-secondary">Volver al calendario</Link></div>
  </form>;
}
