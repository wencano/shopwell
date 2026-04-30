import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { listAllOrders } from "@/lib/data/queries";
import { formatAud } from "@/lib/format";
import Link from "next/link";

export const metadata = { title: "Admin · Orders" };

export default async function AdminOrdersPage() {
  const orders = await listAllOrders();

  return (
    <div>
      <h1 className="text-2xl font-semibold">All orders</h1>
      <Table className="mt-8">
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Store</TableHead>
            <TableHead>Buyer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-mono text-xs">
                <Link href={`/seller/orders/${o.id}`} className="underline">
                  {o.id.slice(0, 8)}…
                </Link>
              </TableCell>
              <TableCell>{o.storeId.slice(0, 8)}…</TableCell>
              <TableCell>{o.buyerUserId.slice(0, 8)}…</TableCell>
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
