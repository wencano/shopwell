"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  productId: string;
  slug: string;
  title: string;
  priceCents: number;
  qty: number;
  imageUrl?: string | null;
};

type CartState = {
  items: CartLine[];
  add: (line: Omit<CartLine, "qty"> & { qty?: number }) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (line) => {
        const q = line.qty ?? 1;
        const items = get().items;
        const i = items.findIndex((x) => x.productId === line.productId);
        if (i >= 0) {
          const next = [...items];
          next[i] = { ...next[i], qty: next[i].qty + q };
          set({ items: next });
        } else {
          set({
            items: [
              ...items,
              {
                productId: line.productId,
                slug: line.slug,
                title: line.title,
                priceCents: line.priceCents,
                imageUrl: line.imageUrl,
                qty: q,
              },
            ],
          });
        }
      },
      setQty: (productId, qty) => {
        if (qty < 1) {
          set({ items: get().items.filter((x) => x.productId !== productId) });
          return;
        }
        set({
          items: get().items.map((x) =>
            x.productId === productId ? { ...x, qty } : x,
          ),
        });
      },
      remove: (productId) =>
        set({ items: get().items.filter((x) => x.productId !== productId) }),
      clear: () => set({ items: [] }),
    }),
    { name: "shopwell-cart" },
  ),
);

export function cartTotalCents(items: CartLine[]) {
  return items.reduce((s, i) => s + i.priceCents * i.qty, 0);
}
