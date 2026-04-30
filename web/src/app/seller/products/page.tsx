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
import { getSellerStoreId, listSellerProducts } from "@/lib/data/queries";
import { formatAud } from "@/lib/format";

export const metadata = { title: "Seller · Products" };

export default async function SellerProductsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const storeId = await getSellerStoreId(user.id);
  if (!storeId) return <p>No store.</p>;
  const rows = await listSellerProducts(storeId);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Products</h1>
      <Table className="mt-8">
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.title}</TableCell>
              <TableCell className="text-muted-foreground">{p.slug}</TableCell>
              <TableCell>
                <Badge variant="secondary">{p.status}</Badge>
              </TableCell>
              <TableCell className="text-right">{formatAud(p.priceCents)}</TableCell>
              <TableCell className="text-right">{p.stockQuantity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
