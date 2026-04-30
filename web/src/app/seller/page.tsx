import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSellerStoreId, listOrdersForStore, listSellerProducts } from "@/lib/data/queries";

export const metadata = { title: "Seller dashboard" };

export default async function SellerHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const storeId = await getSellerStoreId(user.id);
  if (!storeId) {
    return <p>No store membership found.</p>;
  }
  const productCount = (await listSellerProducts(storeId)).length;
  const orders = await listOrdersForStore(storeId);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Seller</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Catalogue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{productCount}</p>
            <p className="text-sm text-muted-foreground">Published & draft products</p>
            <Link href="/seller/products" className="mt-4 inline-block text-sm underline">
              Manage products
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{orders.length}</p>
            <p className="text-sm text-muted-foreground">All time (demo data)</p>
            <Link href="/seller/orders" className="mt-4 inline-block text-sm underline">
              View orders
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
