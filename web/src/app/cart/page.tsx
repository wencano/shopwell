"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cartTotalCents, useCart } from "@/stores/cart";
import { formatAud } from "@/lib/format";

export default function CartPage() {
  const { items, setQty, remove } = useCart();
  const total = cartTotalCents(items);

  if (!items.length) {
    return (
      <div className="text-center">
        <h1 className="font-heading text-3xl font-medium">Your cart is empty</h1>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-medium tracking-tight">Cart</h1>
      <ul className="mt-8 divide-y divide-border/70 border-y border-border/70">
        {items.map((i) => (
          <li key={i.productId} className="flex gap-5 py-7">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-muted shadow-sm">
              {i.imageUrl ? (
                <Image src={i.imageUrl} alt="" fill className="object-cover" />
              ) : null}
            </div>
            <div className="flex-1">
              <Link
                href={`/products/${i.slug}`}
                className="font-medium hover:underline"
              >
                {i.title}
              </Link>
              <p className="text-sm text-accent-price">
                {formatAud(i.priceCents)} each
              </p>
              <div className="mt-2 flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Qty</label>
                <input
                  type="number"
                  min={1}
                  className="w-16 rounded border bg-background px-2 py-1 text-sm"
                  value={i.qty}
                  onChange={(e) =>
                    setQty(i.productId, Number.parseInt(e.target.value, 10) || 1)
                  }
                />
                <Button variant="ghost" size="sm" onClick={() => remove(i.productId)}>
                  Remove
                </Button>
              </div>
            </div>
            <div className="text-right font-semibold tabular-nums text-accent-price">
              {formatAud(i.priceCents * i.qty)}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col items-end gap-4">
        <p className="text-lg">
          Subtotal <span className="font-semibold text-accent-price">{formatAud(total)}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Shipping ($9.95) added at checkout.
        </p>
        <Button asChild size="lg" className="rounded-full font-semibold">
          <Link href="/checkout">Checkout</Link>
        </Button>
      </div>
    </div>
  );
}
