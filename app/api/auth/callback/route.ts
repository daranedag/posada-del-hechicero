import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin";
import { auth } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    await auth.signOut();
    return NextResponse.redirect(new URL("/admin/login?error=no_autorizado", request.url));
  }
  return NextResponse.redirect(new URL("/admin", request.url));
}
