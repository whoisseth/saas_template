import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@/components/analytics";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/json-ld";
import { Toaster } from "sonner";
import { env } from "@/lib/env";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const APP_URL = env.NEXT_PUBLIC_APP_URL || "https://cashdeals.in";
const APP_NAME = "CashDeals";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#059669",
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: "CashDeals - Online Shopping Cashback & Scratch Cards", template: `%s | CashDeals` },
  description: "Shop on Flipkart, Amazon & Myntra and get guaranteed cash rewards directly to your UPI ID.",
  applicationName: "CashDeals",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "CashDeals",
    title: "CashDeals - Online Shopping Cashback & Scratch Cards",
    description: "Earn guaranteed instant cash rewards on Flipkart and Amazon shopping directly to your UPI.",
  },
  twitter: { card: "summary_large_image", title: "CashDeals" },
  robots: {
    index: env.NEXT_PUBLIC_IS_PREVIEW ? false : true,
    follow: env.NEXT_PUBLIC_IS_PREVIEW ? false : true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sansFont.variable} suppressHydrationWarning>
      <body className={`${sansFont.variable} min-h-screen font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
          <Toaster position="top-center" richColors closeButton />
          <Analytics />
          <OrganizationJsonLd />
          <WebSiteJsonLd />
        </ThemeProvider>
      </body>
    </html>
  );
}
