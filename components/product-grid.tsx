import Image from "next/image";
import { ArrowUpRight, PackageSearch } from "lucide-react";
import type { Product } from "@/lib/types";

const availabilityLabel: Record<Product["availability"], string> = {
  disponible: "Disponible",
  preventa: "Preventa",
  agotado: "Agotado",
  consultar: "Consultar",
};

export function ProductGrid({ products }: { products: Product[] }) {
  const instagram = process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/posada.delhechicero/";

  if (!products.length) {
    return (
      <div className="pdh-panel flex min-h-72 flex-col items-center justify-center px-6 text-center">
        <PackageSearch className="size-9 text-copper" />
        <h2 className="mt-5 text-3xl">Catalogo listo para conectarse</h2>
        <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
          Esta vitrina se actualiza desde InsForge. La tienda puede publicar productos, fotos, precios y disponibilidad sin modificar el sitio.
        </p>
        <a href={instagram} target="_blank" rel="noreferrer" className="pdh-button-primary mt-6">
          Consultar en Instagram <ArrowUpRight className="size-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <article key={product.id} className="pdh-panel group overflow-hidden">
          <div className="relative aspect-[4/3] bg-secondary">
            {product.image_url ? (
              <Image src={product.image_url} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-105" />
            ) : (
              <div className="grid size-full place-items-center"><PackageSearch className="size-10 text-muted-foreground/45" /></div>
            )}
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.12em]">
              <span className="text-teal">{product.eyebrow ?? "La Posada"}</span>
              <span className="text-muted-foreground">{availabilityLabel[product.availability]}</span>
            </div>
            <h2 className="mt-3 text-2xl leading-none">{product.name}</h2>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{product.description}</p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="font-bold">{product.price_clp === null ? "Precio por confirmar" : `$${product.price_clp.toLocaleString("es-CL")}`}</p>
              <a href={instagram} target="_blank" rel="noreferrer" aria-label={`Consultar ${product.name}`}><ArrowUpRight className="size-5 text-copper" /></a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
