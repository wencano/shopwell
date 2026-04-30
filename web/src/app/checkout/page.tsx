"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCheckoutSession } from "@/actions/checkout";
import { useCart } from "@/stores/cart";
import { formatAud } from "@/lib/format";
import { cartTotalCents } from "@/stores/cart";

export default function CheckoutPage() {
  const items = useCart((s) => s.items);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  if (!items.length) {
    return (
      <div>
        <p>Your cart is empty.</p>
        <Button asChild className="mt-4">
          <Link href="/products">Shop</Link>
        </Button>
      </div>
    );
  }

  const subtotal = cartTotalCents(items);
  const ship = 995;
  const total = subtotal + ship;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <p className="mt-2 text-muted-foreground">
        Subtotal {formatAud(subtotal)} + shipping {formatAud(ship)} ={" "}
        <strong>{formatAud(total)}</strong>
      </p>
      <form
        className="mt-8 space-y-4"
        action={(fd) => {
          setErr(null);
          const line1 = String(fd.get("line1") || "");
          const line2 = String(fd.get("line2") || "");
          const city = String(fd.get("city") || "");
          const state = String(fd.get("state") || "");
          const postcode = String(fd.get("postcode") || "");
          start(async () => {
            try {
              await createCheckoutSession({
                lines: items,
                line1,
                line2: line2 || undefined,
                city,
                state,
                postcode,
              });
            } catch (e) {
              setErr(e instanceof Error ? e.message : "Checkout failed");
            }
          });
        }}
      >
        <div>
          <Label htmlFor="line1">Street address</Label>
          <Input id="line1" name="line1" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="line2">Apartment / suite (optional)</Label>
          <Input id="line2" name="line2" className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" required className="mt-1" />
          </div>
        </div>
        <div>
          <Label htmlFor="postcode">Postcode</Label>
          <Input id="postcode" name="postcode" required className="mt-1" />
        </div>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        <Button type="submit" size="lg" disabled={pending} className="w-full">
          {pending ? "Redirecting…" : "Pay with Stripe"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          You will be redirected to Stripe Checkout. Sign in required.
        </p>
      </form>
    </div>
  );
}
