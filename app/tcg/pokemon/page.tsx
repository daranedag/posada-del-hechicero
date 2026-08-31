import { Zap } from "lucide-react";
import { TcgGamePage } from "@/components/tcg-page";

export const metadata = { title: "Pokémon TCG" };
export const revalidate = 300;

export default function PokemonPage() {
  return <TcgGamePage system="pokemon" kicker="Pokémon TCG" title="Tu próxima colección empieza aquí." description="Sobres, productos especiales y un espacio amable para aprender, intercambiar y jugar." icon={Zap} eventCopy="Aprende a jugar y comparte con otros entrenadores de Valdivia." />;
}
