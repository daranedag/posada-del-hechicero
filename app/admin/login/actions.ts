"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export async function loginWithGoogleAction() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || !process.env.NEON_AUTH_BASE_URL) redirect("/admin/login?error=configuracion");
  const { data, error } = await auth.signIn.social({
    provider: "google",
    callbackURL: new URL("/api/auth/callback", appUrl).toString(),
    errorCallbackURL: new URL("/admin/login?error=oauth_callback", appUrl).toString(),
    disableRedirect: true,
  });
  if (error || !data?.url) redirect("/admin/login?error=oauth_inicio");
  redirect(data.url);
}

export async function logoutAction() {
  await auth.signOut();
  redirect("/admin/login");
}
