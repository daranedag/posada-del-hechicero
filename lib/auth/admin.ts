import "server-only";
import { redirect } from "next/navigation";
import { isAdminEmailAllowed, parseAdminEmails } from "@/lib/auth/admin-emails";
import { adminInsforge } from "@/lib/insforge/admin";
import { getServerInsforge } from "@/lib/insforge/server";

type AdminCandidate = {
  id: string;
  email: string;
  emailVerified: boolean;
  profile: { name?: string } | null;
};

export function hasConfiguredAdminEmails() {
  return parseAdminEmails(process.env.PDH_ADMIN_EMAILS).length > 0;
}

export async function authorizeAdminUser<T extends AdminCandidate>(user: T) {
  const isAllowed = user.emailVerified && isAdminEmailAllowed(user.email, process.env.PDH_ADMIN_EMAILS);

  if (!isAllowed) {
    await adminInsforge.database.from("pdh_admins").delete().eq("user_id", user.id);
    return null;
  }

  const { data: existingAdmin, error: readError } = await adminInsforge.database
    .from("pdh_admins")
    .select("user_id,display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError) return null;
  if (existingAdmin) return { ...user, admin: existingAdmin };

  const admin = {
    user_id: user.id,
    display_name: user.profile?.name?.trim() || user.email.split("@")[0],
  };
  const { error: insertError } = await adminInsforge.database
    .from("pdh_admins")
    .upsert([admin], { onConflict: "user_id" });

  return insertError ? null : { ...user, admin };
}

export async function getAdminUser() {
  const client = await getServerInsforge();
  const { data, error } = await client.auth.getCurrentUser();
  const user = data.user;
  if (error || !user) return null;
  return authorizeAdminUser(user);
}

export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}
