"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthActions } from "@insforge/sdk/ssr";

function authActions(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createAuthActions({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL, anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY, cookies: cookieStore });
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 8) redirect("/admin/login?error=datos");
  const auth = authActions(await cookies());
  const { error } = await auth.signInWithPassword({ method: "password", email, password });
  if (error) redirect("/admin/login?error=credenciales");
  redirect("/admin");
}

export async function logoutAction() {
  const auth = authActions(await cookies());
  await auth.signOut();
  redirect("/admin/login");
}
