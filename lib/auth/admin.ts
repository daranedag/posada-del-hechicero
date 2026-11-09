import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { parseAdminEmails } from "@/lib/auth/admin-emails";
import { authorizeIdentity } from "@/lib/auth/identity";
import { auth } from "@/lib/auth/server";

export function hasConfiguredAdminEmails() {
  return parseAdminEmails(process.env.PDH_ADMIN_EMAILS).length > 0;
}

export async function getAdminUser() {
  await connection();
  const { data, error } = await auth.getSession();
  const user = data?.user;
  if (error || !user) return null;
  return authorizeIdentity(user, process.env.PDH_ADMIN_EMAILS);
}

export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}
