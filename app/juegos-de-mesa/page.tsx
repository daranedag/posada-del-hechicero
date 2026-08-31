import Link from "next/link";
import { ArrowRight, Dice5, Users } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { ProductGrid } from "@/components/product-grid";
import { getProducts } from "@/lib/data/catalog";

export const metadata = { title: "Juegos de mesa" };
export const revalidate = 300;

export default async function BoardGamesPage() {
  const products = await getProducts({ category: "board-game" });
  return (
    <>
      <PageHero
        kicker="Juegos de mesa"
        title="La excusa perfecta para juntarse."
        description="Desde una primera partida familiar hasta una noche de estrategia intensa. Una vitrina conectada al inventario de la tienda permite descubrir qué jugar y consultar disponibilidad."
        icon={Dice5}
      />
      <section className="pdh-section pdh-container">
        <ProductGrid products={products} />
      </section>
      <section className="pdh-container pb-20">
        <div className="pdh-panel flex flex-col justify-between gap-7 p-8 sm:flex-row sm:items-center sm:p-10">
          <div>
            <p className="pdh-kicker"><Users className="size-4" /> Comunidad</p>
            <h2 className="mt-4 text-3xl">¿No sabes cuál elegir?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Cuéntanos cuántos juegan y qué tipo de experiencia buscan.</p>
          </div>
          <Link href="/contacto" className="pdh-button-primary shrink-0">Pedir recomendación <ArrowRight className="size-4" /></Link>
        </div>
      </section>
    </>
  );
}
