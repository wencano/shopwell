import { NextResponse } from "next/server";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) {
    return new NextResponse("Webhook not configured", { status: 501 });
  }

  const stripe = new Stripe(key);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("No signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    if (orderId && session.payment_status === "paid") {
      await db
        .update(orders)
        .set({
          status: "processing",
          paymentStatus: "succeeded",
          paidAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      const existing = await db
        .select({ id: payments.id })
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .limit(1);
      if (!existing.length) {
        const amount = session.amount_total ?? 0;
        await db.insert(payments).values({
          id: randomUUID(),
          orderId,
          provider: "stripe",
          providerPaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
          providerChargeId: null,
          amountCents: amount,
          currency: "AUD",
          status: "succeeded",
          createdAt: new Date(),
          capturedAt: new Date(),
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
