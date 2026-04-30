import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSellerStoreId, listOrdersForStore } from "@/lib/data/queries";
import { formatAud } from "@/lib/format";

export const metadata = { title: "Seller · Orders" };

export default async function SellerOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const storeId = await getSellerStoreId(user.id);
  if (!storeId) return <p>No store.</p>;
  const orders = await listOrdersForStore(storeId);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Store orders</h1>
      <Table className="mt-8">
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Buyer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell>
                <Link
                  href={`/seller/orders/${o.id}`}
                  className="font-mono text-xs underline"
                >
                  {o.id.slice(0, 8)}…
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{o.buyerUserId.slice(0, 8)}…</TableCell>
              <TableCell>
                <Badge variant="secondary">{o.status}</Badge>
              </TableCell>
              <TableCell className="text-right">{formatAud(o.totalCents)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
