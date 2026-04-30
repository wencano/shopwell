/**
 * Seed database + auth users from ../seed/shopwell.seed.json
 * Requires: DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY)
 * Optional: SEED_USER_PASSWORD (default ShopwellDemo2026!)
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";

import "dotenv/config";

const SEED_PATH = resolve(process.cwd(), "..", "seed", "shopwell.seed.json");
const DEFAULT_PASSWORD = process.env.SEED_USER_PASSWORD || "ShopwellDemo2026!";

function orderPaymentStatus(
  raw: string,
): "pending" | "succeeded" | "failed" {
  if (raw === "paid") return "succeeded";
  return raw as "pending" | "succeeded" | "failed";
}

async function main() {
  const url = process.env.DATABASE_URL;
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !sbUrl || !serviceKey) {
    console.error(
      "Missing DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, or SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY)",
    );
    process.exit(1);
  }

  const raw = readFileSync(SEED_PATH, "utf-8");
  const data = JSON.parse(raw) as {
    store: Record<string, unknown>;
    users: Array<{
      id: string;
      email: string;
      full_name: string;
      phone?: string;
      role: string;
      avatar_url?: string;
    }>;
    store_members: Array<{ store_id: string; user_id: string; member_role: string }>;
    categories: Array<Record<string, unknown>>;
    products: Array<Record<string, unknown>>;
    addresses: Array<Record<string, unknown>>;
    orders: Array<Record<string, unknown>>;
    order_items: Array<Record<string, unknown>>;
    payments: Array<Record<string, unknown>>;
    invoices: Array<Record<string, unknown>>;
    shipments: Array<Record<string, unknown>>;
  };

  const sb = createClient(sbUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const u of data.users) {
    const { error } = await sb.auth.admin.createUser({
      id: u.id,
      email: u.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: u.full_name },
    });

    if (error && !String(error.message).toLowerCase().includes("already")) {
      console.warn("auth user", u.email, error.message);
    } else if (!error || String(error.message).toLowerCase().includes("already")) {
      console.log("auth user ok:", u.email);
    }
  }

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });

  await db.transaction(async (tx) => {
    const st = data.store;
    await tx
      .insert(schema.stores)
      .values({
        id: st.id as string,
        slug: st.slug as string,
        name: st.name as string,
        tagline: (st.tagline as string) ?? null,
        description: (st.description as string) ?? null,
        logoUrl: (st.logo_url as string) ?? null,
        abn: (st.abn as string) ?? null,
        email: (st.email as string) ?? null,
        currency: (st.currency as string) ?? "AUD",
        status: "active",
      })
      .onConflictDoUpdate({
        target: schema.stores.id,
        set: {
          slug: st.slug as string,
          name: st.name as string,
          tagline: (st.tagline as string) ?? null,
          description: (st.description as string) ?? null,
          logoUrl: (st.logo_url as string) ?? null,
          abn: (st.abn as string) ?? null,
          email: (st.email as string) ?? null,
        },
      });

    for (const u of data.users) {
      await tx.insert(schema.profiles).values({
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        phone: u.phone ?? null,
        avatarUrl: u.avatar_url ?? null,
      }).onConflictDoUpdate({
        target: schema.profiles.id,
        set: {
          email: u.email,
          fullName: u.full_name,
          phone: u.phone ?? null,
          avatarUrl: u.avatar_url ?? null,
        },
      });

      const storeId =
        u.role === "seller"
          ? data.store_members.find((m) => m.user_id === u.id)?.store_id ?? null
          : null;

      const existing = await tx
        .select()
        .from(schema.userRoles)
        .where(eq(schema.userRoles.userId, u.id));
      if (existing.length === 0) {
        await tx.insert(schema.userRoles).values({
          userId: u.id,
          role: u.role as "super_admin" | "seller" | "buyer",
          storeId: storeId ?? null,
        });
      }
    }

    for (const m of data.store_members) {
      await tx
        .insert(schema.storeMembers)
        .values({
          storeId: m.store_id,
          userId: m.user_id,
          memberRole: m.member_role as "owner" | "staff",
        })
        .onConflictDoNothing({
          target: [schema.storeMembers.storeId, schema.storeMembers.userId],
        });
    }

    for (const c of data.categories) {
      await tx.insert(schema.categories).values({
        id: c.id as string,
        slug: c.slug as string,
        name: c.name as string,
        description: (c.description as string) ?? null,
      }).onConflictDoUpdate({
        target: schema.categories.id,
        set: {
          slug: c.slug as string,
          name: c.name as string,
          description: (c.description as string) ?? null,
        },
      });
    }

    for (const p of data.products) {
      await tx.insert(schema.products).values({
        id: p.id as string,
        storeId: p.store_id as string,
        categoryId: (p.category_id as string) ?? null,
        slug: p.slug as string,
        title: p.title as string,
        description: (p.description as string) ?? null,
        priceCents: p.price_cents as number,
        compareAtCents: (p.compare_at_cents as number) ?? null,
        stockQuantity: (p.stock_quantity as number) ?? 0,
        status: (p.status as string) === "published" ? "published" : "draft",
      }).onConflictDoUpdate({
        target: schema.products.id,
        set: {
          slug: p.slug as string,
          title: p.title as string,
          description: (p.description as string) ?? null,
          priceCents: p.price_cents as number,
          compareAtCents: (p.compare_at_cents as number) ?? null,
          stockQuantity: (p.stock_quantity as number) ?? 0,
          status: (p.status as string) === "published" ? "published" : "draft",
        },
      });

      await tx
        .delete(schema.productImages)
        .where(eq(schema.productImages.productId, p.id as string));
      if (p.image_url) {
        await tx.insert(schema.productImages).values({
          productId: p.id as string,
          url: p.image_url as string,
          alt: ((p.image_alt as string) ?? p.title) as string,
          sortOrder: 0,
        });
      }
    }

    for (const a of data.addresses) {
      await tx.insert(schema.addresses).values({
        id: a.id as string,
        userId: a.user_id as string,
        label: (a.label as string) ?? null,
        line1: a.line1 as string,
        line2: (a.line2 as string) || null,
        city: a.city as string,
        state: a.state as string,
        postcode: a.postcode as string,
        country: (a.country as string) ?? "AU",
      }).onConflictDoUpdate({
        target: schema.addresses.id,
        set: {
          label: (a.label as string) ?? null,
          line1: a.line1 as string,
          line2: (a.line2 as string) || null,
          city: a.city as string,
          state: a.state as string,
          postcode: a.postcode as string,
          country: (a.country as string) ?? "AU",
        },
      });
    }

    for (const o of data.orders) {
      await tx.insert(schema.orders).values({
        id: o.id as string,
        storeId: o.store_id as string,
        buyerUserId: o.buyer_user_id as string,
        shippingAddressId: (o.shipping_address_id as string) ?? null,
        status: o.status as
          | "pending_payment"
          | "processing"
          | "shipped"
          | "delivered"
          | "cancelled",
        fulfillmentStatus: o.fulfillment_status as
          | "unfulfilled"
          | "in_transit"
          | "delivered"
          | "cancelled",
        paymentStatus: orderPaymentStatus(o.payment_status as string),
        subtotalCents: o.subtotal_cents as number,
        shippingCents: (o.shipping_cents as number) ?? 0,
        discountCents: (o.discount_cents as number) ?? 0,
        taxCents: (o.tax_cents as number) ?? 0,
        totalCents: o.total_cents as number,
        currency: (o.currency as string) ?? "AUD",
        placedAt: new Date(o.placed_at as string),
        paidAt: o.paid_at ? new Date(o.paid_at as string) : null,
        cancelledAt: o.cancelled_at ? new Date(o.cancelled_at as string) : null,
        cancellationReason: (o.cancellation_reason as string) ?? null,
        notesBuyer: (o.notes_buyer as string) ?? null,
        stripeCheckoutSessionId: (o.stripe_checkout_session_id as string) ?? null,
      }).onConflictDoUpdate({
        target: schema.orders.id,
        set: {
          status: o.status as
            | "pending_payment"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled",
          fulfillmentStatus: o.fulfillment_status as
            | "unfulfilled"
            | "in_transit"
            | "delivered"
            | "cancelled",
          paymentStatus: orderPaymentStatus(o.payment_status as string),
          paidAt: o.paid_at ? new Date(o.paid_at as string) : null,
        },
      });
    }

    for (const li of data.order_items) {
      await tx.insert(schema.orderItems).values({
        id: li.id as string,
        orderId: li.order_id as string,
        productId: li.product_id as string,
        storeId: li.store_id as string,
        titleSnapshot: li.title_snapshot as string,
        quantity: li.quantity as number,
        unitPriceCents: li.unit_price_cents as number,
      }).onConflictDoNothing();
    }

    for (const pay of data.payments) {
      await tx.insert(schema.payments).values({
        id: pay.id as string,
        orderId: pay.order_id as string,
        provider: (pay.provider as string) ?? "stripe",
        providerPaymentIntentId: (pay.provider_payment_intent_id as string) ?? null,
        providerChargeId: (pay.provider_charge_id as string) ?? null,
        amountCents: pay.amount_cents as number,
        currency: (pay.currency as string) ?? "AUD",
        status: pay.status as "pending" | "succeeded" | "failed",
        failureCode: (pay.failure_code as string) ?? null,
        failureMessage: (pay.failure_message as string) ?? null,
        createdAt: new Date(pay.created_at as string),
        capturedAt: pay.captured_at ? new Date(pay.captured_at as string) : null,
      }).onConflictDoNothing();
    }

    for (const inv of data.invoices) {
      await tx.insert(schema.invoices).values({
        id: inv.id as string,
        orderId: inv.order_id as string,
        invoiceNumber: inv.invoice_number as string,
        status: inv.status as "open" | "paid" | "void",
        subtotalCents: inv.subtotal_cents as number,
        shippingCents: (inv.shipping_cents as number) ?? 0,
        taxCents: (inv.tax_cents as number) ?? 0,
        totalCents: inv.total_cents as number,
        currency: (inv.currency as string) ?? "AUD",
        issuedAt: new Date(inv.issued_at as string),
        dueAt: inv.due_at ? new Date(inv.due_at as string) : null,
        paidAt: inv.paid_at ? new Date(inv.paid_at as string) : null,
        pdfUrl: (inv.pdf_url as string) ?? null,
      }).onConflictDoNothing();
    }

    for (const sh of data.shipments) {
      await tx.insert(schema.shipments).values({
        id: sh.id as string,
        orderId: sh.order_id as string,
        carrier: (sh.carrier as string) ?? null,
        serviceLevel: (sh.service_level as string) ?? null,
        trackingNumber: (sh.tracking_number as string) ?? null,
        trackingUrl: (sh.tracking_url as string) ?? null,
        status: sh.status as
          | "pending"
          | "label_created"
          | "in_transit"
          | "out_for_delivery"
          | "delivered"
          | "exception",
        shippedAt: sh.shipped_at ? new Date(sh.shipped_at as string) : null,
        deliveredAt: sh.delivered_at ? new Date(sh.delivered_at as string) : null,
        lastEventAt: sh.last_event_at ? new Date(sh.last_event_at as string) : null,
        lastEventDetail: (sh.last_event_detail as string) ?? null,
      }).onConflictDoNothing();
    }
  });

  await client.end();
  console.log("Seed completed. Demo password for all users:", DEFAULT_PASSWORD);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
