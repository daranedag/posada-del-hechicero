import { redirect } from "next/navigation";

export default function ContactPage() {
  redirect(process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/posada.delhechicero/");
}
