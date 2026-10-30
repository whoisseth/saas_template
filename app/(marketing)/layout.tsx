import Link from "next/link";
import { Sparkles, LayoutDashboard, Smartphone, ShieldCheck, ArrowRight } from "lucide-react";
import { PwaSmartBanner } from "@/components/pwa-smart-banner";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-emerald-500 selection:text-white">
      {/* Non-intrusive Mobile PWA Floating Card (Only appears on mobile scroll) */}
      <PwaSmartBanner />

      {/* Clean Sticky Header (No fixed top notification) */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <nav className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                CashDeals<span className="text-foreground">.in</span>
              </span>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-6 text-xs sm:text-sm font-semibold">
            <Link href="/deals" className="text-muted-foreground hover:text-foreground transition-colors">
              Hot Deals
            </Link>
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
              <LayoutDashboard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Dashboard
            </Link>
            <Link href="/app" className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
              <Smartphone className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Get App
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-xl font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs flex items-center gap-1.5 transition-all"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              My Dashboard
            </Link>
            <Link
              href="/sign-in"
              className="px-3.5 py-1.5 rounded-xl font-semibold border border-border hover:bg-muted text-xs transition-colors"
            >
              Sign In
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>

      {/* Native Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Footer */}
      <footer className="border-t border-border/80 bg-muted/20 text-xs text-muted-foreground mt-12 hidden sm:block">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>© {new Date().getFullYear()} CashDeals.in — 100% Free Cashback & Rewards</span>
          </div>
          <div className="flex gap-6 font-medium">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/app" className="hover:text-foreground">Download App</Link>
            <Link href="/admin" className="hover:text-foreground text-emerald-600 dark:text-emerald-400">Admin Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
