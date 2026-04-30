"use server";

import { randomUUID } from "crypto";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { addresses, orderItems, orders, products } from "@/db/schema";
import type { CartLine } from "@/stores/cart";

const shippingCents = 995;

type StripeClient = InstanceType<typeof Stripe>;
type CheckoutSessionCreateParams = NonNullable<
  Parameters<StripeClient["checkout"]["sessions"]["create"]>[0]
>;
type CheckoutLineItem = NonNullable<CheckoutSessionCreateParams["line_items"]>[number];

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY missing");
  return new Stripe(key);
}

export async function createCheckoutSession(input: {
  lines: CartLine[];
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postcode: string;
  country?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required");

  if (!input.lines.length) throw new Error("Cart is empty");

  const first = (
    await db
      .select({ storeId: products.storeId })
      .from(products)
      .where(eq(products.id, input.lines[0].productId))
      .limit(1)
  )[0];
  const storeId = first?.storeId;
  if (!storeId) throw new Error("Invalid product");

  const dbProducts = await db
    .select()
    .from(products)
    .where(eq(products.storeId, storeId));
  const byId = new Map(dbProducts.map((p) => [p.id, p]));

  let subtotal = 0;
  const lineItems: CheckoutLineItem[] = [];
  for (const line of input.lines) {
    const p = byId.get(line.productId);
    if (!p || p.status !== "published") throw new Error("Product unavailable");
    const unit = p.priceCents;
    subtotal += unit * line.qty;
    lineItems.push({
      price_data: {
        currency: "aud",
        unit_amount: unit,
        product_data: {
          name: p.title,
          metadata: { productId: p.id },
        },
      },
      quantity: line.qty,
    });
  }

  if (lineItems.length && shippingCents > 0) {
    lineItems.push({
      price_data: {
        currency: "aud",
        unit_amount: shippingCents,
        product_data: { name: "Standard shipping (AU)" },
      },
      quantity: 1,
    });
  }

  const addressId = randomUUID();
  await db.insert(addresses).values({
    id: addressId,
    userId: user.id,
    label: "Shipping",
    line1: input.line1,
    line2: input.line2 || null,
    city: input.city,
    state: input.state,
    postcode: input.postcode,
    country: input.country || "AU",
  });

  const orderId = randomUUID();
  const total = subtotal + shippingCents;

  await db.insert(orders).values({
    id: orderId,
    storeId,
    buyerUserId: user.id,
    shippingAddressId: addressId,
    status: "pending_payment",
    fulfillmentStatus: "unfulfilled",
    paymentStatus: "pending",
    subtotalCents: subtotal,
    shippingCents: shippingCents,
    discountCents: 0,
    taxCents: 0,
    totalCents: total,
    currency: "AUD",
    placedAt: new Date(),
    paidAt: null,
  });

  for (const line of input.lines) {
    const p = byId.get(line.productId)!;
    await db.insert(orderItems).values({
      id: randomUUID(),
      orderId,
      productId: p.id,
      storeId,
      titleSnapshot: p.title,
      quantity: line.qty,
      unitPriceCents: p.priceCents,
    });
  }

  const stripe = getStripe();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email ?? undefined,
    line_items: lineItems,
    success_url: `${origin}/account/orders?paid=1`,
    cancel_url: `${origin}/checkout?cancelled=1`,
    metadata: {
      order_id: orderId,
      store_id: storeId,
    },
  });

  await db
    .update(orders)
    .set({ stripeCheckoutSessionId: session.id })
    .where(eq(orders.id, orderId));

  if (!session.url) throw new Error("Stripe session missing URL");
  redirect(session.url);
}
