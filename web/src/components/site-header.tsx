import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { HeaderCart } from "@/components/header-cart";
import { getUserRolesForHeader } from "@/lib/data/queries";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const roles = user ? await getUserRolesForHeader(user.id) : [];
  const isAdmin = roles.some((r) => r.role === "super_admin");
  const isSeller = roles.some(
    (r) => r.role === "seller" || r.role === "super_admin",
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="group shrink-0 font-heading text-xl font-medium tracking-tight text-foreground transition-colors hover:text-primary sm:text-2xl"
        >
          ShopWell
        </Link>
        <nav className="flex flex-1 flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm font-medium text-muted-foreground sm:justify-start">
          <Link
            href="/products"
            className="relative transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all hover:text-foreground hover:after:w-full"
          >
            Shop
          </Link>
          <Link
            href="/about"
            className="relative transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all hover:text-foreground hover:after:w-full"
          >
            About
          </Link>
          {isSeller ? (
            <Link
              href="/seller"
              className="relative transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all hover:text-foreground hover:after:w-full"
            >
              Seller
            </Link>
          ) : null}
          {isAdmin ? (
            <Link
              href="/admin"
              className="relative transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all hover:text-foreground hover:after:w-full"
            >
              Admin
            </Link>
          ) : null}
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <HeaderCart />
          {user ? (
            <>
              <Link
                href="/account"
                className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
              >
                Account
              </Link>
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="hidden font-medium sm:inline-flex">
                <Link href="/signup">Join</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
