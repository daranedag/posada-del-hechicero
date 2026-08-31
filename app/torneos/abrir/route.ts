import { redirect } from "next/navigation";

export function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  redirect(code ? `/torneos/${code}` : "/torneos");
}
