"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthActions } from "@insforge/sdk/ssr";
import { OAUTH_CODE_VERIFIER_COOKIE } from "@/lib/auth/oauth";

function authActions(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createAuthActions({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
    cookies: cookieStore,
  });
}

export async function loginWithGoogleAction() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || !process.env.NEXT_PUBLIC_INSFORGE_URL || !process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY) {
    redirect("/admin/login?error=configuracion");
  }

  const cookieStore = await cookies();
  const auth = authActions(cookieStore);
  const { data, error } = await auth.signInWithOAuth("google", {
    redirectTo: new URL("/api/auth/callback", appUrl).toString(),
    skipBrowserRedirect: true,
    additionalParams: { prompt: "select_account" },
  });

  if (error || !data.url || !data.codeVerifier) {
    redirect("/admin/login?error=oauth_inicio");
  }

  cookieStore.set(OAUTH_CODE_VERIFIER_COOKIE, data.codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  redirect(data.url);
}

export async function logoutAction() {
  const auth = authActions(await cookies());
  await auth.signOut();
  redirect("/admin/login");
}
