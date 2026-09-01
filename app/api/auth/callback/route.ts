import { NextRequest, NextResponse } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";
import { authorizeAdminUser } from "@/lib/auth/admin";
import { OAUTH_CODE_VERIFIER_COOKIE } from "@/lib/auth/oauth";

function setDestination(response: NextResponse, request: NextRequest, path: string) {
  response.headers.set("Location", new URL(path, request.url).toString());
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("insforge_code");
  const verifier = request.cookies.get(OAUTH_CODE_VERIFIER_COOKIE)?.value;

  if (!code || !verifier) {
    const response = NextResponse.redirect(new URL("/admin/login?error=oauth_callback", request.url));
    response.cookies.delete(OAUTH_CODE_VERIFIER_COOKIE);
    return response;
  }

  const response = NextResponse.redirect(new URL("/admin", request.url));
  const auth = createAuthActions({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });
  const { data, error } = await auth.exchangeOAuthCode(code, verifier);
  response.cookies.delete(OAUTH_CODE_VERIFIER_COOKIE);

  if (error || !data?.user) {
    await auth.signOut();
    setDestination(response, request, "/admin/login?error=oauth_callback");
    return response;
  }

  const admin = await authorizeAdminUser(data.user);
  if (!admin) {
    await auth.signOut();
    setDestination(response, request, "/admin/login?error=no_autorizado");
  }

  return response;
}
