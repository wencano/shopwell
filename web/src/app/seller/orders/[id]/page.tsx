import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getOrderDetail, getSellerStoreId, getUserRoles } from "@/lib/data/queries";
import { formatAud } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

export default async function SellerOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();
  const roles = await getUserRoles(user.id);
  const isSuper = roles.some((r) => r.role === "super_admin");
  const storeId = isSuper ? null : await getSellerStoreId(user.id);
  if (!isSuper && !storeId) notFound();
  const detail = await getOrderDetail(id);
  if (!detail) notFound();
  if (!isSuper && detail.order.storeId !== storeId) notFound();

  const { order, items, payments, shipments } = detail;

  return (
    <div>
      <Link href="/seller/orders" className="text-sm text-muted-foreground hover:underline">
        ← Orders
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Order (seller)</h1>
      <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge>{order.status}</Badge>
        <Badge variant="outline">{order.paymentStatus}</Badge>
        <Badge variant="outline">{order.fulfillmentStatus}</Badge>
      </div>
      <Separator className="my-6" />
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.id} className="flex justify-between text-sm">
            <span>
              {i.titleSnapshot} × {i.quantity}
            </span>
            <span>{formatAud(i.unitPriceCents * i.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-right text-lg font-medium">
        Total {formatAud(order.totalCents)}
      </p>
      <h2 className="mt-8 font-medium">Payments</h2>
      <ul className="mt-2 text-sm text-muted-foreground">
        {payments.map((p) => (
          <li key={p.id}>
            {p.status} · {formatAud(p.amountCents)}
          </li>
        ))}
      </ul>
      <h2 className="mt-6 font-medium">Shipments</h2>
      <ul className="mt-2 text-sm text-muted-foreground">
        {shipments.map((s) => (
          <li key={s.id}>
            {s.carrier} · {s.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
