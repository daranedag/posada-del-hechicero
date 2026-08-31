import { Shield } from "lucide-react";
import { TcgGamePage } from "@/components/tcg-page";

export const metadata = { title: "Mitos y Leyendas" };
export const revalidate = 300;

export default function MylPage() {
  return <TcgGamePage system="mitos-y-leyendas" kicker="Mitos y Leyendas" title="La leyenda chilena sigue en juego." description="Ediciones, accesorios y comunidad para descubrir o volver al TCG hecho en Chile." icon={Shield} eventCopy="Nuevos retos y jugadores veteranos se encuentran en la misma mesa." />;
}
