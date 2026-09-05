"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { adminInsforge } from "@/lib/insforge/admin";

const idSchema = z.string().uuid();
const statusSchema = z.enum(["new", "read", "archived"]);

export async function updateContactStatusAction(formData: FormData) {
  await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  const status = statusSchema.safeParse(formData.get("status"));
  if (!id.success || !status.success) redirect("/admin/consultas?estado=error");

  const { error } = await adminInsforge.database
    .from("pdh_contact_submissions")
    .update({ status: status.data })
    .eq("id", id.data);
  if (error) redirect("/admin/consultas?estado=error");

  revalidatePath("/admin");
  revalidatePath("/admin/consultas");
  redirect("/admin/consultas?estado=guardado");
}

export async function deleteContactSubmissionAction(formData: FormData) {
  await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) redirect("/admin/consultas?estado=error");

  const { error } = await adminInsforge.database.from("pdh_contact_submissions").delete().eq("id", id.data);
  if (error) redirect("/admin/consultas?estado=error");

  revalidatePath("/admin");
  revalidatePath("/admin/consultas");
  redirect("/admin/consultas?estado=eliminado");
}
