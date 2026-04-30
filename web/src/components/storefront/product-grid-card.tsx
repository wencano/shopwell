import Link from "next/link";
import Image from "next/image";
import type { ProductCard } from "@/lib/data/queries";
import { formatAud } from "@/lib/format";

export function ProductGridCard({ product }: { product: ProductCard }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="store-product-card group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-[0_20px_48px_-24px_oklch(0.32_0.06_155/0.35)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            className="object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        {product.categoryName ? (
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {product.categoryName}
          </p>
        ) : null}
        <h3 className="mt-2 font-heading text-lg font-medium leading-snug tracking-tight text-foreground">
          {product.title}
        </h3>
        <p className="mt-auto pt-3 font-medium text-accent-price">
          {formatAud(product.priceCents)}
        </p>
      </div>
    </Link>
  );
}
