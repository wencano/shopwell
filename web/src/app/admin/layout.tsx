import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRoles } from "@/lib/data/queries";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const roles = await getUserRoles(user.id);
  const ok = roles.some((r) => r.role === "super_admin");
  if (!ok) redirect("/");
  return <>{children}</>;
}
