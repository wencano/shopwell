import "server-only";

import { db } from "@/db";
import {
  categories,
  orderItems,
  orders,
  payments,
  productImages,
  products,
  profiles,
  shipments,
  storeMembers,
  stores,
  userRoles,
} from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

export type ProductCard = {
  id: string;
  slug: string;
  title: string;
  priceCents: number;
  imageUrl: string | null;
  categoryName: string | null;
};

export async function listPublishedProducts(): Promise<ProductCard[]> {
  const rows = await db
    .select({
      product: products,
      imageUrl: productImages.url,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(productImages, eq(productImages.productId, products.id))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(products.status, "published"))
    .orderBy(products.title);

  const byId = new Map<string, ProductCard>();
  for (const r of rows) {
    const id = r.product.id;
    if (!byId.has(id)) {
      byId.set(id, {
        id,
        slug: r.product.slug,
        title: r.product.title,
        priceCents: r.product.priceCents,
        imageUrl: r.imageUrl,
        categoryName: r.categoryName,
      });
    }
  }
  return [...byId.values()];
}

export async function getProductBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  if (!row) return null;
  const imgs = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, row.id))
    .orderBy(asc(productImages.sortOrder));
  let category = null;
  if (row.categoryId) {
    const [c] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, row.categoryId))
      .limit(1);
    category = c ?? null;
  }
  const [store] = await db
    .select()
    .from(stores)
    .where(eq(stores.id, row.storeId))
    .limit(1);
  return { product: row, images: imgs, category, store: store ?? null };
}

export async function getStorefrontStore() {
  const [row] = await db.select().from(stores).limit(1);
  return row ?? null;
}

export async function getUserRoles(userId: string) {
  return db.select().from(userRoles).where(eq(userRoles.userId, userId));
}

export async function getProfile(userId: string) {
  const [p] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return p ?? null;
}

export async function listOrdersForUser(userId: string) {
  return db
    .select()
    .from(orders)
    .where(eq(orders.buyerUserId, userId))
    .orderBy(desc(orders.placedAt));
}

export async function listAllOrders() {
  return db.select().from(orders).orderBy(desc(orders.placedAt));
}

export async function listOrdersForStore(storeId: string) {
  return db
    .select()
    .from(orders)
    .where(eq(orders.storeId, storeId))
    .orderBy(desc(orders.placedAt));
}

export async function getOrderDetail(orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order) return null;
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
  const pays = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, orderId));
  const ships = await db
    .select()
    .from(shipments)
    .where(eq(shipments.orderId, orderId));
  return { order, items, payments: pays, shipments: ships };
}

export async function getSellerStoreId(userId: string) {
  const [m] = await db
    .select()
    .from(storeMembers)
    .where(eq(storeMembers.userId, userId))
    .limit(1);
  return m?.storeId ?? null;
}

export async function listSellerProducts(storeId: string) {
  return db.select().from(products).where(eq(products.storeId, storeId));
}

