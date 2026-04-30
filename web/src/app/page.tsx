import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGridCard } from "@/components/storefront/product-grid-card";
import { getStorefrontStore, listPublishedProducts } from "@/lib/data/queries";
import { STOREFRONT_HERO_IMAGE, STOREFRONT_HERO_STACK_IMAGE } from "@/lib/storefront-assets";

export default async function HomePage() {
  const store = await getStorefrontStore();
  const products = await listPublishedProducts();

  return (
    <div className="space-y-20 pb-8">
      <section className="store-reveal relative overflow-hidden rounded-3xl border border-border/60 bg-card/90 px-6 py-12 shadow-[0_4px_40px_-12px_oklch(0.32_0.06_155/0.2)] sm:px-10 sm:py-16 md:px-14 md:py-20">
        <div
          className="pointer-events-none absolute -right-24 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full opacity-[0.14]"
          style={{
            background:
              "radial-gradient(circle at center, oklch(0.42 0.08 158) 0%, transparent 70%)",
          }}
        />
        <div className="relative grid gap-10 lg:grid-cols-[1.12fr_1fr] lg:items-center">
          <div>
            <p className="store-reveal store-reveal-delay-1 inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-primary">
              <Leaf className="h-3.5 w-3.5 opacity-80" aria-hidden />
              {store?.tagline ?? "Wellness, thoughtfully sourced"}
            </p>
            <h1 className="store-reveal store-reveal-delay-1 mt-5 max-w-xl text-4xl font-medium leading-[1.08] tracking-tight sm:text-5xl md:text-[3.25rem]">
              {store?.name ?? "ShopWell"}
            </h1>
            <p className="store-reveal store-reveal-delay-2 mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              {store?.description ??
                "Plant-forward supplements, skincare, and everyday rituals — an AU-focused demo built for calm discovery."}
            </p>
            <div className="store-reveal store-reveal-delay-3 mt-9 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="rounded-full px-8 font-semibold shadow-md">
                <Link href="/products">
                  Browse collection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Link
                href="/about"
                className="text-sm font-semibold text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Our story
              </Link>
            </div>
          </div>
          <div className="store-reveal store-reveal-delay-2 relative mx-auto w-full max-w-md pb-12 lg:max-w-none">
            {/* Rear silhouette “card” — empty framed layer */}
            <div
              className="pointer-events-none absolute inset-x-6 bottom-8 top-16 z-0 rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary/[0.08] via-muted/30 to-background shadow-[inset_0_1px_0_0_oklch(1_0_0/0.35)] rotate-[-5deg]"
              aria-hidden
            />
            {/* Middle stacked frame — dashed editorial echo */}
            <div
              className="pointer-events-none absolute inset-x-10 bottom-12 top-10 z-[1] rounded-2xl border border-dashed border-primary/40 bg-background/40 backdrop-blur-[1px] rotate-[4deg]"
              aria-hidden
            />
            {/* Primary spa photo */}
            <div className="relative z-10 mx-auto aspect-[4/5] w-[min(100%,420px)] overflow-hidden rounded-2xl border-2 border-border/80 bg-muted shadow-[0_28px_64px_-28px_oklch(0.32_0.06_155/0.5)] lg:w-[min(100%,460px)] rotate-[-1.5deg]">
              <Image
                src={STOREFRONT_HERO_IMAGE}
                alt="Calm spa setting with towels and stones"
                fill
                priority
                sizes="(max-width:1024px) 90vw, 44vw"
                className="object-cover"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-background/10"
                aria-hidden
              />
            </div>
            {/* Offset stacked second photo — polaroid-style */}
            <div className="absolute bottom-6 right-0 z-20 w-[min(48%,240px)] rotate-[7deg] drop-shadow-[0_14px_32px_-10px_rgba(0,0,0,0.3)]">
              <div className="overflow-hidden rounded-lg border-[6px] border-card bg-card shadow-lg">
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  <Image
                    src={STOREFRONT_HERO_STACK_IMAGE}
                    alt=""
                    fill
                    sizes="240px"
                    className="object-cover"
                  />
                </div>
                <div className="h-2 bg-card" aria-hidden />
              </div>
            </div>
            <p className="relative z-[5] mx-auto mt-8 max-w-sm px-2 text-center text-xs font-medium leading-relaxed text-muted-foreground">
              Slow commerce &amp; thoughtful sourcing — curated for everyday rituals.
            </p>
          </div>
        </div>
      </section>

      <section className="store-reveal store-reveal-delay-3">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-heading text-3xl font-medium tracking-tight">Featured</h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              A rotating snapshot from our catalogue — same quality as the full shop.
            </p>
          </div>
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            View everything
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 6).map((p) => (
            <ProductGridCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
