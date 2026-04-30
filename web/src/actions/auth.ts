"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles, userRoles } from "@/db/schema";

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/account");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }
  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUpBuyer(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("fullName") || "");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }
  const user = data.user;
  if (!user) {
    redirect(
      `/signup?error=${encodeURIComponent("Check email to confirm account.")}`,
    );
  }
  await db.insert(profiles).values({
    id: user.id,
    email,
    fullName: fullName || email.split("@")[0] || "Customer",
    phone: null,
    avatarUrl: null,
  }).onConflictDoUpdate({
    target: profiles.id,
    set: { email, fullName: fullName || email },
  });
  const existingRole = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, user.id));
  if (existingRole.length === 0) {
    await db.insert(userRoles).values({
      userId: user.id,
      role: "buyer",
      storeId: null,
    });
  }
  revalidatePath("/", "layout");
  redirect("/account");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
