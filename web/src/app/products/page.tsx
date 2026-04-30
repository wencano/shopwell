import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductGridCard } from "@/components/storefront/product-grid-card";
import { listPublishedProducts } from "@/lib/data/queries";

export const metadata = { title: "Shop products" };

export default async function ProductsPage() {
  const products = await listPublishedProducts();

  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Home
      </Link>
      <header className="mt-8 max-w-2xl">
        <h1 className="font-heading text-4xl font-medium tracking-tight sm:text-5xl">The shop</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Prices in <span className="font-medium text-foreground">AUD</span>. Shipping is calculated at
          checkout. Each card opens the full product story.
        </p>
      </header>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductGridCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
