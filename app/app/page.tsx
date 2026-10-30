import type { Metadata } from "next";
import QRCode from "qrcode";
import { AppDownloadLandingView } from "@/components/app-download-landing-view";
import Link from "next/link";
import { ArrowLeft, Sparkles, LayoutDashboard } from "lucide-react";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cashdeals.in";
const FULL_INSTALL_URL = `${APP_URL}/app`;

export const metadata: Metadata = {
  title: "Install Mobile App | CashDeals",
  description:
    "Get the official CashDeals mobile app. 1-tap installation with instant access to Flipkart & Amazon cashback, deals, and scratch cards.",
  alternates: {
    canonical: "/app",
  },
  openGraph: {
    title: "Install CashDeals Mobile App",
    description:
      "Instant access to verified cashback on Flipkart & Amazon shopping directly to your UPI.",
    url: "/app",
  },
};

export default async function AppDownloadPage() {
  let qrCodeDataUrl = "";
  try {
    qrCodeDataUrl = await QRCode.toDataURL(FULL_INSTALL_URL, {
      margin: 1,
      width: 240,
      color: {
        dark: "#059669",
        light: "#ffffff",
      },
    });
  } catch {
    // Graceful fallback
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20 sm:pb-12">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                CashDeals<span className="text-foreground">.in</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-xl font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs flex items-center gap-1.5 transition-all"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">My</span> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center py-6 sm:py-10">
        <AppDownloadLandingView
          initialQrCode={qrCodeDataUrl}
          appUrl={FULL_INSTALL_URL}
        />
      </main>

      <MobileBottomNav />
    </div>
  );
}
