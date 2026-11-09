import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/admin/login",
  publicRoutes: ["/admin/login", "/api/tournaments"],
});

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
