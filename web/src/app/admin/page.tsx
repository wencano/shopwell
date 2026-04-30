import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAllOrders, listPublishedProducts } from "@/lib/data/queries";
import { db } from "@/db";
import { stores, profiles } from "@/db/schema";

export const metadata = { title: "Admin" };

export default async function AdminHomePage() {
  const [storeRows, userRows, orders, products] = await Promise.all([
    db.select().from(stores).limit(5),
    db.select().from(profiles).limit(50),
    listAllOrders(),
    listPublishedProducts(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Super admin</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{storeRows.length}</p>
            <p className="text-sm text-muted-foreground">Seeded demo store(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{userRows.length}</p>
            <p className="text-sm text-muted-foreground">Registered profiles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{orders.length}</p>
            <Link href="/admin/orders" className="mt-2 inline-block text-sm underline">
              View all
            </Link>
          </CardContent>
        </Card>
      </div>
      <p className="text-sm text-muted-foreground">
        Published products in catalogue: {products.length}
      </p>
    </div>
  );
}
