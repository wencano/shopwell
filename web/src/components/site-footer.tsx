import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/80 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="font-heading text-lg font-medium tracking-tight">ShopWell</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-primary-foreground/85">
            Australian wellness marketplace — curated rituals, skincare, and supplements. Demo
            storefront.
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm text-primary-foreground/85">
          <Link href="/shipping" className="w-fit font-medium underline-offset-4 hover:underline">
            Shipping &amp; returns
          </Link>
          <Link href="/privacy" className="w-fit font-medium underline-offset-4 hover:underline">
            Privacy
          </Link>
          <Link href="/terms" className="w-fit font-medium underline-offset-4 hover:underline">
            Terms
          </Link>
        </div>
        <div className="text-sm text-primary-foreground/80">
          <p className="font-medium text-primary-foreground">hello@shopwell.example</p>
          <p className="mt-3 font-mono text-xs tracking-wide opacity-90">ABN 12 345 678 901 (sample)</p>
        </div>
      </div>
    </footer>
  );
}
