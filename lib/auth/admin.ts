import "server-only";
import { redirect } from "next/navigation";
import { adminInsforge } from "@/lib/insforge/admin";
import { getServerInsforge } from "@/lib/insforge/server";

export async function getAdminUser() {
  const client = await getServerInsforge();
  const { data, error } = await client.auth.getCurrentUser();
  const user = data.user;
  if (error || !user) return null;

  const bootstrapEmail = process.env.PDH_BOOTSTRAP_ADMIN_EMAIL?.toLowerCase();
  if (bootstrapEmail && user.email.toLowerCase() === bootstrapEmail) {
    await adminInsforge.database.from("pdh_admins").upsert([{ user_id: user.id, display_name: user.profile?.name ?? user.email.split("@")[0] }], { onConflict: "user_id" });
  }

  const { data: admin } = await adminInsforge.database.from("pdh_admins").select("user_id,display_name").eq("user_id", user.id).maybeSingle();
  return admin ? { ...user, admin } : null;
}

export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}
