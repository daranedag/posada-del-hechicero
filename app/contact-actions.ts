"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { publicInsforge } from "@/lib/insforge/public";

export interface ContactFormState {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<"name" | "email" | "subject" | "message", string[]>>;
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre.").max(120),
  email: z.string().trim().email("Escribe un correo válido.").max(254),
  subject: z.string().trim().min(2, "Cuéntanos brevemente el motivo.").max(160),
  message: z.string().trim().min(10, "La consulta debe tener al menos 10 caracteres.").max(4000),
  website: z.string().max(0),
});

export async function submitContactAction(
  _previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const input = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    website: formData.get("website") ?? "",
  });

  if (!input.success) {
    if (String(formData.get("website") ?? "")) {
      return { status: "success", message: "Recibimos tu consulta. Te responderemos pronto." };
    }

    const fields = input.error.flatten().fieldErrors;
    return {
      status: "error",
      message: "Revisa los campos marcados e inténtalo nuevamente.",
      errors: {
        name: fields.name,
        email: fields.email,
        subject: fields.subject,
        message: fields.message,
      },
    };
  }

  const { name, email, subject, message } = input.data;
  const { error } = await publicInsforge.database.from("pdh_contact_submissions").insert([
    { name, email, subject, message, status: "new" },
  ]);

  if (error) {
    console.error("No se pudo guardar la consulta de contacto", error);
    return {
      status: "error",
      message: "No pudimos enviar tu consulta. Inténtalo nuevamente o escríbenos por Instagram.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/consultas");
  return { status: "success", message: "Recibimos tu consulta. Te responderemos pronto." };
}
