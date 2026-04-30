import type { Metadata } from "next";
import { DM_Sans, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "ShopWell — Australian wellness marketplace",
    template: "%s · ShopWell",
  },
  description: "ShopWell — curated wellness products for Australia.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body
        className={`${dmSans.variable} ${fraunces.variable} ${jetbrainsMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <Providers>
          <div className="store-backdrop flex min-h-screen flex-col">
            <SiteHeader />
            <main className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
              {children}
            </main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
