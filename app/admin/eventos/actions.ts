"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { adminInsforge } from "@/lib/insforge/admin";
import { getImageKitAsset } from "@/lib/imagekit";
import { chileInstant, isDate, occursOn } from "@/lib/events/calendar";
import { getAdminEvent, getEventException } from "@/lib/events/data";
import { eventInputSchema } from "@/lib/events/validation";

export interface EventFormState { message: string; errors?: Record<string, string[] | undefined> }

export async function saveEventAction(_previous: EventFormState, form: FormData): Promise<EventFormState> {
  const user = await requireAdmin();
  const result = eventInputSchema.safeParse({
    ...Object.fromEntries(form.entries()), days: form.getAll("days"),
  });
  if (!result.success) return { message: "Revisa los campos indicados.", errors: result.error.flatten().fieldErrors };
  const input = result.data;
  const mode = z.enum(["create", "update", "occurrence", "future"]).safeParse(form.get("mode"));
  if (!mode.success) return { message: "El tipo de edición no es válido." };
  const id = mode.data === "create" ? null : z.string().uuid().safeParse(form.get("id"));
  if (id && !id.success) return { message: "El evento no es válido." };
  const eventId = id?.success ? id.data : null;
  const occurrenceDate = String(form.get("occurrence_date") ?? "");
  const datedEdit = mode.data === "occurrence" || mode.data === "future";
  if (datedEdit && (!isDate(occurrenceDate) || occurrenceDate !== input.date)) return { message: "Conserva la fecha seleccionada. Para otra fecha, duplica el evento." };
  if (mode.data === "occurrence" && input.status === "draft") return { message: "Una fecha individual puede estar publicada o cancelada. Para guardar un borrador, edita esta fecha y las siguientes." };

  let targetId: string | null = null;
  try {
    const previous = eventId ? await getAdminEvent(eventId) : null;
    if (eventId && !previous) return { message: "El evento ya no existe." };
    if (input.deck_registration === "on" && mode.data !== "create") return { message: "La inscripción se activa al crear un evento nuevo." };
    if (previous?.tournament_id && (input.repetition !== "once" || input.event_type !== "magic")) return { message: "Un evento con inscripción de decks debe conservar la categoría Magic y una sola fecha." };
    if (previous && datedEdit && !occursOn(previous, occurrenceDate)) return { message: "La fecha ya no pertenece a esta programación. Recarga el calendario." };
    const exception = previous && mode.data === "occurrence" ? await getEventException(previous.id, occurrenceDate) : null;
    // Existing image metadata comes from trusted rows, never hidden client URLs.
    const duplicateId = z.string().uuid().safeParse(form.get("duplicate_id"));
    const duplicate = mode.data === "create" && duplicateId.success ? await getAdminEvent(duplicateId.data) : null;
    const duplicateDate = String(form.get("duplicate_date") ?? "");
    const duplicateException = duplicate && isDate(duplicateDate) && occursOn(duplicate, duplicateDate)
      ? await getEventException(duplicate.id, duplicateDate) : null;
    const currentImage = exception ?? previous ?? duplicateException ?? duplicate;
    let image = { image_url: currentImage?.image_url ?? null, image_key: currentImage?.image_key ?? null };
    if (form.get("remove_image") === "on") image = { image_url: null, image_key: null };
    const fileId = String(form.get("imagekitFileId") ?? "");
    if (fileId) {
      const asset = await getImageKitAsset(fileId);
      image = { image_url: asset.url, image_key: `imagekit:${asset.fileId}` };
    }
    const { data, error } = await adminInsforge.database.rpc("pdh_save_calendar_event_with_registration", {
      p_owner_id: user.id,
      p_registration: input.deck_registration === "on" ? {
        format_code: input.deck_format,
        submission_deadline: chileInstant(`${input.deck_deadline_date}T${input.deck_deadline_time}`),
      } : null,
      p_id: eventId,
      p_mode: mode.data,
      p_date: datedEdit ? occurrenceDate : null,
      p_expected_updated_at: previous ? String(form.get("updated_at") ?? "") : null,
      p_values: {
        title: input.title, description: input.description, event_type: input.event_type,
        format_label: input.format_label || null, location: input.location, ...image,
        starts_at: chileInstant(`${input.date}T${input.start_time}`),
        ends_at: chileInstant(`${input.end_date}T${input.end_time}`), status: input.status,
        recurrence_days: input.repetition === "weekly" ? [...new Set(input.days)].sort() : null,
        recurrence_until: input.repetition === "weekly" ? input.until || null : null,
      },
    });
    if (error) {
      console.error("No se pudo guardar el evento", error.message);
      return { message: error.message?.includes("EVENT_CONFLICT")
        ? "Otra edición cambió este evento. Recarga la página antes de guardar para no sobrescribirla."
        : "No se pudo guardar el evento. Tus cambios siguen en el formulario; inténtalo nuevamente." };
    }
    targetId = String(data);
  } catch (error) {
    return { message: error instanceof Error ? error.message : "No se pudo guardar el evento." };
  }
  revalidatePath("/");
  revalidatePath("/admin/eventos");
  revalidatePath("/admin");
  revalidatePath("/torneos", "layout");
  revalidatePath("/admin/torneos", "layout");
  if (targetId) revalidatePath(`/admin/eventos/${targetId}`);
  redirect(`/admin/eventos?mes=${input.date.slice(0, 7)}&estado=guardado`);
}
