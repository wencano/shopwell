"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/stores/cart";

export function HeaderCart() {
  const n = useCart((s) => s.items.reduce((a, i) => a + i.qty, 0));
  return (
    <Button variant="outline" size="sm" asChild className="gap-2">
      <Link href="/cart">
        <ShoppingBag className="h-4 w-4" />
        Cart {n > 0 ? `(${n})` : ""}
      </Link>
    </Button>
  );
}
