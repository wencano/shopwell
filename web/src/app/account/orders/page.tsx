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
import { listOrdersForUser } from "@/lib/data/queries";
import { formatAud } from "@/lib/format";

export const metadata = { title: "Your orders" };

export default async function AccountOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const orders = await listOrdersForUser(user.id);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Your orders</h1>
      <p className="mt-2 text-muted-foreground">
        Track payments and shipping for your purchases.
      </p>
      <Table className="mt-8">
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell>
                <Link href={`/account/orders/${o.id}`} className="font-mono text-sm underline">
                  {o.id.slice(0, 8)}…
                </Link>
              </TableCell>
              <TableCell>
                {o.placedAt.toLocaleString("en-AU", { dateStyle: "medium" })}
              </TableCell>
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
