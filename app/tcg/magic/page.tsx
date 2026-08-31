import { Flame } from "lucide-react";
import { TcgGamePage } from "@/components/tcg-page";

export const metadata = { title: "Magic: The Gathering" };
export const revalidate = 300;

export default function MagicPage() {
  return <TcgGamePage system="magic" kicker="Magic: The Gathering" title="De la primera tierra al próximo top." description="Producto sellado, comunidad Commander y juego competitivo reconocido por Wizards of the Coast." icon={Flame} eventCopy="Friday Night Magic, Commander y clasificatorios: encuentra tu próxima ronda." />;
}
