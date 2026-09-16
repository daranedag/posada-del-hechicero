"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, Plus, Repeat2 } from "lucide-react";
import { addDays, chileDate, dayLabel, eventTime, eventTypeLabels, monthRange, occurrenceStatus, shiftMonth, validMonth, type EventOccurrence } from "@/lib/events/calendar";
import { InstagramConsult } from "./instagram-consult";

export function EventCalendar({ month, events, initialNow, admin = false }: { month: string; events: EventOccurrence[]; initialNow: number; admin?: boolean }) {
  const [now, setNow] = useState(initialNow);
  const today = chileDate(now);
  const [selected, setSelected] = useState(today.startsWith(month) ? today : `${month}-01`);
  useEffect(() => {
    const update = () => { if (!document.hidden) setNow(Date.now()); };
    const timer = window.setInterval(update, 30000);
    document.addEventListener("visibilitychange", update);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", update); };
  }, []);
  const monthHref = (value: string) => admin ? `/admin/eventos?mes=${value}` : `/?mes=${value}#calendario`;
  const { first, last } = monthRange(month);
  const leading = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7;
  const days: string[] = [];
  for (let date = first; date <= last; date = addDays(date, 1)) days.push(date);
  const onDay = (date: string) => events.filter(event => event.occurrence_date === date || (event.occurrence_date < date && chileDate(event.ends_at ?? event.starts_at) >= date && event.ends_at && eventTime(event.ends_at) !== "00:00"));
  const selectedEvents = onDay(selected);
  const upcoming = events.filter(event => event.occurrence_date >= today && !event.cancelled && event.status !== "draft" && occurrenceStatus(event, now) !== "Finalizado").slice(0, 6);
  const showUpcomingBesideDay = upcoming.length > 0 && !selectedEvents.some(event => event.image_url);
  const monthLabel = new Intl.DateTimeFormat("es-CL", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(`${first}T12:00:00Z`));
  return <div className="grid gap-8">
    <div className="pdh-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-foreground/10 p-4 sm:p-6">
        <div><p className="pdh-kicker">{admin ? "Organiza la agenda" : "Encuentra tu próxima partida"}</p><h2 className="mt-2 text-3xl first-letter:uppercase sm:text-4xl">{monthLabel}</h2></div>
        <div className="flex items-center gap-2">
          {validMonth(shiftMonth(month, -1)) && <Link href={monthHref(shiftMonth(month, -1))} scroll={false} className="pdh-button-secondary size-10 p-0" aria-label="Mes anterior"><ChevronLeft className="size-5" /></Link>}
          <Link href={monthHref(today.slice(0, 7))} scroll={false} onClick={() => setSelected(today)} className="pdh-button-secondary h-10 px-4">Hoy</Link>
          {validMonth(shiftMonth(month, 1)) && <Link href={monthHref(shiftMonth(month, 1))} scroll={false} className="pdh-button-secondary size-10 p-0" aria-label="Mes siguiente"><ChevronRight className="size-5" /></Link>}
        </div>
      </div>
      <div className="grid grid-cols-7 bg-secondary/40 text-center text-xs font-bold uppercase tracking-wide">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(day => <div key={day} className="py-3">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-px bg-foreground/10">
        {Array.from({ length: leading }, (_, index) => <div key={`empty-${index}`} className="bg-card/80" />)}
        {days.map(date => {
          const dayEvents = onDay(date);
          const past = date < today;
          return <button key={date} type="button" aria-pressed={selected === date} aria-current={date === today ? "date" : undefined} aria-label={`${dayLabel(date)}: ${dayEvents.length} ${dayEvents.length === 1 ? "evento" : "eventos"}${date === today ? ", hoy" : ""}`} onClick={() => setSelected(date)} className={`relative flex min-h-20 min-w-0 flex-col items-start gap-1 p-1.5 text-left outline-offset-[-3px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:min-h-36 sm:gap-2 sm:p-3 ${selected === date ? "bg-secondary ring-2 ring-inset ring-primary" : "bg-card hover:bg-secondary/60"} ${past ? "text-muted-foreground" : ""}`}>
            <span className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold ${date === today ? "bg-primary text-primary-foreground" : ""}`}>{Number(date.slice(-2))}</span>
            <span className="flex flex-wrap gap-1 sm:hidden" aria-hidden="true">{dayEvents.slice(0, 3).map(event => <span key={event.occurrence_id} className={`size-1.5 rounded-full ${event.cancelled ? "bg-muted-foreground" : event.recurring ? "bg-teal" : "bg-copper"}`} />)}</span>
            <span className="hidden w-full space-y-1 sm:block" aria-hidden="true">{dayEvents.slice(0, 3).map(event => <span key={event.occurrence_id} className={`block truncate rounded px-1.5 py-1 text-[11px] font-semibold ${event.cancelled ? "bg-muted text-muted-foreground line-through" : event.recurring ? "bg-teal/10 text-teal" : "bg-copper/15 text-foreground"}`} title={event.title}>{eventTime(event.starts_at)} · {event.title}</span>)}</span>
            {dayEvents.length > 3 && <span className="text-[10px] font-bold">+{dayEvents.length - 3}</span>}
          </button>;
        })}
        {Array.from({ length: (7 - (leading + days.length) % 7) % 7 }, (_, index) => <div key={`trailing-${index}`} className="bg-card/80" />)}
      </div>
      <div className="flex flex-wrap gap-4 p-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-teal" /> Habituales</span><span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-copper" /> Especiales</span><span>Horarios de Chile · Selecciona un día para ver sus actividades</span></div>
    </div>
    <div className={`grid items-start gap-8 ${showUpcomingBesideDay ? "lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" : ""}`}>
    <section aria-labelledby="selected-day-title" className="grid min-w-0 gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="pdh-kicker">{selected === today ? "Hoy en la Posada" : "Actividades del día"}</p><h2 id="selected-day-title" className="mt-2 text-3xl first-letter:uppercase">{dayLabel(selected)}</h2></div>{admin && <Link href={`/admin/eventos/nuevo?fecha=${selected}`} className="pdh-button-primary"><Plus className="size-4" /> Agregar evento</Link>}</div>
      {!selectedEvents.length && <div className="pdh-panel p-8 text-center"><CalendarDays className="mx-auto size-8 text-copper" /><h3 className="mt-4 text-2xl">No hay actividades programadas para este día.</h3><p className="mt-2 text-sm text-muted-foreground">Selecciona otra fecha para explorar el calendario.</p></div>}
      {selectedEvents.map(event => <article key={event.occurrence_id} className="pdh-panel grid overflow-hidden md:grid-cols-[1fr_auto]">
        <div className="min-w-0 p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold"><span className="rounded-full bg-secondary px-3 py-1">{eventTypeLabels[event.event_type]}</span><span className="inline-flex items-center gap-1 text-muted-foreground">{event.recurring && <Repeat2 className="size-3" />}{event.recurring ? "Habitual" : "Especial"}</span><span className={`rounded-full px-3 py-1 ${event.cancelled ? "bg-red-100 text-red-800" : occurrenceStatus(event, now) === "En curso" ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>{occurrenceStatus(event, now)}</span></div>
          <h3 className="mt-3 break-words text-3xl">{event.title}</h3>
          {event.format_label && <p className="mt-1 text-sm font-bold text-teal">{event.format_label}</p>}
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">{event.description}</p>
          <div className="my-5 grid gap-2 text-sm"><p className="flex items-center gap-2"><Clock3 className="size-4 shrink-0 text-copper" />{eventTime(event.starts_at)}{event.ends_at ? `–${eventTime(event.ends_at)}${chileDate(event.ends_at) !== event.occurrence_date ? " (día siguiente)" : ""}` : " · Término por confirmar"}</p><p className="flex items-center gap-2"><MapPin className="size-4 shrink-0 text-copper" />{event.location}</p></div>
          {admin ? <div className="flex flex-wrap gap-2"><Link href={`/admin/eventos/${event.id}?fecha=${event.occurrence_date}`} className="pdh-button-primary">Editar / cancelar</Link><Link href={`/admin/eventos/nuevo?duplicar=${event.id}&fecha=${event.occurrence_date}`} className="pdh-button-secondary">Duplicar</Link></div> : !event.cancelled && <InstagramConsult title={event.title} date={event.occurrence_date} startsAt={event.starts_at} />}
        </div>
        {event.image_url && <div className="relative order-first min-h-52 md:order-last md:w-72"><Image src={event.image_url} alt={event.title} fill sizes="(max-width: 768px) 100vw, 288px" className="object-cover" /></div>}
      </article>)}
    </section>
    {upcoming.length > 0 && <section className="min-w-0"><h2 className="text-3xl">Próximamente este mes</h2><div className={`mt-4 grid gap-3 sm:grid-cols-2 ${showUpcomingBesideDay ? "lg:grid-cols-1" : "lg:grid-cols-3"}`}>{upcoming.map(event => <button key={event.occurrence_id} type="button" className="pdh-panel min-w-0 p-4 text-left transition hover:border-copper" onClick={() => { setSelected(event.occurrence_date); document.getElementById("selected-day-title")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}><span className="text-xs font-bold text-teal">{event.occurrence_date.slice(8)}/{event.occurrence_date.slice(5, 7)} · {eventTime(event.starts_at)}</span><span className="mt-1 block break-words font-display text-2xl">{event.title}</span></button>)}</div></section>}
    </div>
  </div>;
}
