import type { Metadata, Viewport } from "next";
import "./globals.css";
import { display, sans, script } from "./fonts";
import { Providers } from "@/components/Providers";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { site } from "@/content/site";
import { localBusinessJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "HatWear | Fitted hats, team gear and custom embroidery in Stockton, CA",
    template: "%s | HatWear Stockton",
  },
  description: site.description,
  openGraph: { type: "website", siteName: "HatWear", locale: "en_US" },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#1a1918",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${script.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only-focusable fixed left-3 top-3 z-[70] bg-ink px-4 py-3 font-semibold text-bone">
          Skip to content
        </a>
        <Providers>
          <AnnouncementBar />
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <CartDrawer />
        </Providers>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd()) }} />
      </body>
    </html>
  );
}
