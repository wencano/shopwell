import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AddToCart } from "@/components/add-to-cart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getProductBySlug } from "@/lib/data/queries";
import { formatAud } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data) return { title: "Product" };
  return { title: data.product.title };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data || data.product.status !== "published") notFound();

  const primary = data.images[0];

  return (
    <div>
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to shop
      </Link>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-start">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-muted/40 shadow-[0_24px_60px_-28px_oklch(0.32_0.06_155/0.35)]">
          <div className="relative aspect-square sm:aspect-[5/6]">
            {primary?.url ? (
              <Image
                src={primary.url}
                alt={primary.alt ?? data.product.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width:1024px) 100vw, 48vw"
              />
            ) : null}
          </div>
        </div>

        <div className="flex flex-col pt-1 lg:sticky lg:top-24">
          {data.category ? (
            <Badge
              variant="secondary"
              className="w-fit rounded-full border border-border/80 bg-secondary/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em]"
            >
              {data.category.name}
            </Badge>
          ) : null}
          <h1 className="mt-4 font-heading text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
            {data.product.title}
          </h1>
          <p className="mt-5 text-3xl font-medium text-accent-price tabular-nums">
            {formatAud(data.product.priceCents)}
          </p>
          <Separator className="my-8 bg-border/70" />
          <div className="max-w-none">
            <p className="whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
              {data.product.description}
            </p>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {data.store?.name ?? "ShopWell"}
            </span>
            <span className="mx-2 text-border">·</span>
            {data.product.stockQuantity} in stock
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <AddToCart
              productId={data.product.id}
              slug={data.product.slug}
              title={data.product.title}
              priceCents={data.product.priceCents}
              imageUrl={primary?.url}
            />
            <Button asChild variant="outline" className="rounded-full border-primary/35">
              <Link href="/products">Continue browsing</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
