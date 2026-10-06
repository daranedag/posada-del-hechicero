import { z } from "zod";
import { addDays, chileInstant, EVENT_TYPES, isDate } from "./calendar.ts";

export const eventInputSchema = z.object({
  title: z.string().trim().min(2, "Escribe un nombre de al menos 2 caracteres.").max(160),
  description: z.string().trim().max(4000),
  event_type: z.enum(EVENT_TYPES),
  format_label: z.string().trim().max(100),
  location: z.string().trim().min(2, "Escribe la ubicación.").max(300),
  date: z.string().refine(isDate, "Elige una fecha válida."),
  end_date: z.string().refine(isDate, "Elige una fecha de término válida."),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Elige la hora de inicio."),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Elige la hora de término."),
  repetition: z.enum(["once", "weekly"]),
  days: z.array(z.coerce.number().int().min(0).max(6)).max(7),
  until: z.string().refine(value => value === "" || isDate(value), "Fecha de término inválida."),
  status: z.enum(["draft", "published", "cancelled"]),
  deck_registration: z.enum(["on", "off"]).default("off"),
  deck_format: z.string().default(""),
  deck_deadline_date: z.string().default(""),
  deck_deadline_time: z.string().default(""),
}).superRefine((input, ctx) => {
  if (input.deck_registration === "on") {
    if (input.event_type !== "magic") ctx.addIssue({ code: "custom", path: ["deck_registration"], message: "La inscripción de decks está disponible para Magic." });
    if (input.repetition !== "once") ctx.addIssue({ code: "custom", path: ["deck_registration"], message: "La inscripción de decks requiere un evento de una sola fecha." });
    if (!["standard", "pioneer", "modern", "pauper"].includes(input.deck_format)) ctx.addIssue({ code: "custom", path: ["deck_format"], message: "Elige un formato para validar los decks." });
    if (!chileInstant(`${input.deck_deadline_date}T${input.deck_deadline_time}`)) ctx.addIssue({ code: "custom", path: ["deck_deadline_time"], message: "Elige una fecha y hora de cierre válidas en Chile." });
  }
  const start = chileInstant(`${input.date}T${input.start_time}`);
  const end = chileInstant(`${input.end_date}T${input.end_time}`);
  if (!start) ctx.addIssue({ code: "custom", path: ["start_time"], message: "Esta hora no existe en Chile por el cambio de horario. Elige otra." });
  if (!end) ctx.addIssue({ code: "custom", path: ["end_time"], message: "Esta hora no existe en Chile por el cambio de horario. Elige otra." });
  if (start && end && end <= start) ctx.addIssue({ code: "custom", path: ["end_time"], message: "El término debe ser posterior al inicio." });
  const daysApart = (Date.parse(input.end_date) - Date.parse(input.date)) / 86400000;
  if (daysApart > 1) ctx.addIssue({ code: "custom", path: ["end_date"], message: "El evento puede terminar el mismo día o al día siguiente." });
  if (input.repetition === "weekly") {
    if (!input.days.length) ctx.addIssue({ code: "custom", path: ["days"], message: "Selecciona al menos un día de la semana." });
    if (isDate(input.date) && input.days.length && input.until) {
      let first = input.date;
      for (let i = 0; i < 7 && !input.days.includes(new Date(`${first}T12:00:00Z`).getUTCDay()); i++) first = addDays(first, 1);
      if (first > input.until) ctx.addIssue({ code: "custom", path: ["until"], message: "El rango debe incluir al menos uno de los días seleccionados." });
    }
    if (input.until && input.until < input.date) ctx.addIssue({ code: "custom", path: ["until"], message: "La repetición no puede terminar antes de comenzar." });
  }
});
export type EventInput = z.infer<typeof eventInputSchema>;
