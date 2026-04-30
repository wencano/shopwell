"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/stores/cart";

export function AddToCart(props: {
  productId: string;
  slug: string;
  title: string;
  priceCents: number;
  imageUrl?: string | null;
}) {
  const add = useCart((s) => s.add);
  return (
    <Button
      className="mt-6"
      size="lg"
      onClick={() =>
        add({
          productId: props.productId,
          slug: props.slug,
          title: props.title,
          priceCents: props.priceCents,
          imageUrl: props.imageUrl,
          qty: 1,
        })
      }
    >
      Add to cart
    </Button>
  );
}
