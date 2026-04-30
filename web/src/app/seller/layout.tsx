import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRoles } from "@/lib/data/queries";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/seller");
  const roles = await getUserRoles(user.id);
  const ok = roles.some((r) => r.role === "seller" || r.role === "super_admin");
  if (!ok) redirect("/");
  return <>{children}</>;
}
