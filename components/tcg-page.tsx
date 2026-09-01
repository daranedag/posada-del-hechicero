import Link from "next/link";
import { ArrowRight, CalendarDays, type LucideIcon } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { ProductGrid } from "@/components/product-grid";
import { getProducts } from "@/lib/data/catalog";
import type { GameSystem } from "@/lib/types";

export async function TcgGamePage({
  system,
  kicker,
  title,
  description,
  icon,
  eventCopy,
}: {
  system: GameSystem;
  kicker: string;
  title: string;
  description: string;
  icon: LucideIcon;
  eventCopy: string;
}) {
  const products = await getProducts({ category: "tcg", gameSystem: system });
  return (
    <>
      <PageHero kicker={kicker} title={title} description={description} icon={icon} />
      <section className="pdh-section pdh-container">
        <ProductGrid products={products} />
      </section>
      <section className="pdh-container pb-20">
        <div className="rounded-[1.25rem] bg-primary p-8 text-primary-foreground sm:p-10">
          <CalendarDays className="size-7" />
          <h2 className="mt-7 max-w-2xl text-4xl leading-none">{eventCopy}</h2>
          <Link href="/eventos" className="mt-7 inline-flex items-center gap-2 font-bold">Revisar calendario <ArrowRight className="size-4" /></Link>
        </div>
      </section>
    </>
  );
}
