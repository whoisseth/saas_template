import Link from "next/link";
import { db } from "@/lib/db";
import { stores, walletLedger, scratchCards } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { LinkConverterBox } from "@/components/link-converter-box";
import { StoreBrandBadge } from "@/components/store-brand-badge";
import { getSession } from "@/lib/session";
import {
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Wallet,
  Smartphone,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const d = db();
  const session = await getSession();

  // If user is logged in, fetch their quick wallet snapshot
  let userConfirmedBalance = 0;
  let userScratchCardsCount = 0;

  if (session?.user) {
    try {
      const balanceRows = await d
        .select({ total: sql<number>`COALESCE(SUM(${walletLedger.amount}), 0)` })
        .from(walletLedger)
        .where(eq(walletLedger.userId, session.user.id));
      userConfirmedBalance = Math.max(0, balanceRows[0]?.total || 0);

      const cardsRows = await d
        .select({ count: sql<number>`COUNT(*)` })
        .from(scratchCards)
        .where(eq(scratchCards.userId, session.user.id));
      userScratchCardsCount = cardsRows[0]?.count || 0;
    } catch (err) {
      console.error("Error fetching user wallet snapshot:", err);
    }
  }

  // Load active partner stores
  let allStores: Array<typeof stores.$inferSelect> = [];
  try {
    allStores = await d
      .select()
      .from(stores)
      .where(eq(stores.isActive, true))
      .limit(4);
  } catch (err) {
    console.error("Error loading stores:", err);
  }

  return (
    <div className="space-y-10 sm:space-y-16 pb-12">
      {/* Logged In Quick Status Strip (Immediately orient logged-in shoppers) */}
      {session?.user && (
        <section className="px-4 max-w-5xl mx-auto pt-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                {session.user.name?.slice(0, 1) || "U"}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  Welcome back, {session.user.name || session.user.email}!
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Confirmed Balance: <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{userConfirmedBalance.toFixed(2)}</span> • {userScratchCardsCount} Scratch Cards Ready
                </p>
              </div>
            </div>
            <Link
              href="/wallet"
              className="py-2 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
            >
              <Wallet className="h-3.5 w-3.5" />
              Open My Wallet
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="relative pt-4 sm:pt-10 px-4 max-w-5xl mx-auto text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Shop on Flipkart & Amazon • Get Guaranteed UPI Cash</span>
        </div>

        <div className="space-y-3 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Shop Online. <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
              Earn Real Cash to Your UPI.
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Never complete an order without cashback again. Paste any product link, buy normally on the store, and withdraw your cash directly to PhonePe or Google Pay.
          </p>
        </div>

        {/* Live Link Converter Tool (Clean, verified, direct) */}
        <div className="pt-2">
          <LinkConverterBox />
        </div>

        {/* Trust Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 max-w-3xl mx-auto text-center">
          <div className="p-3 rounded-2xl bg-muted/40 border border-border/80">
            <span className="text-base sm:text-lg font-extrabold text-foreground">₹4,50,000+</span>
            <span className="text-[11px] text-muted-foreground block">Cashback Paid</span>
          </div>
          <div className="p-3 rounded-2xl bg-muted/40 border border-border/80">
            <span className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400">₹50 Min</span>
            <span className="text-[11px] text-muted-foreground block">Fast UPI Payout</span>
          </div>
          <div className="p-3 rounded-2xl bg-muted/40 border border-border/80">
            <span className="text-base sm:text-lg font-extrabold text-foreground">15,000+</span>
            <span className="text-[11px] text-muted-foreground block">Happy Shoppers</span>
          </div>
          <div className="p-3 rounded-2xl bg-muted/40 border border-border/80">
            <span className="text-base sm:text-lg font-extrabold text-teal-600 dark:text-teal-400">100% Free</span>
            <span className="text-[11px] text-muted-foreground block">Zero Hidden Fees</span>
          </div>
        </div>
      </section>

      {/* Supported Partner Stores (Crisp Vector Brand Badges) */}
      <section className="px-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm sm:text-base font-bold tracking-tight">
              Supported Shopping Platforms
            </h2>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">
            Verified Cashback Rates
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {allStores.map((store) => (
            <a
              key={store.id}
              href={`/api/redirect?url=${encodeURIComponent(store.affiliateBaseUrl)}&storeId=${store.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl border border-border bg-card/60 hover:bg-card hover:border-emerald-500/50 hover:shadow-md transition-all group flex flex-col items-center text-center justify-between min-h-[110px]"
            >
              <div className="h-9 w-full flex items-center justify-center">
                <StoreBrandBadge storeName={store.name} className="h-7" />
              </div>
              <div className="mt-2 text-center">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                  {store.cashbackText}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                  Shop Store <ExternalLink className="h-2.5 w-2.5" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* How It Works (Short, 3 Clear Steps) */}
      <section className="px-4 max-w-5xl mx-auto">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-card to-muted/20 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-1 max-w-md mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Simple 3-Step Process
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">How Cashback Works</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                1
              </span>
              <h3 className="text-xs font-bold">Paste Any Product Link</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Find any product you want on Flipkart, Amazon, Myntra, or Ajio. Paste the link above.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 font-extrabold text-xs">
                2
              </span>
              <h3 className="text-xs font-bold">Buy on Merchant Normally</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Click &apos;Shop on Store&apos;. Complete your purchase normally. We link your order via your SubID.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold text-xs">
                3
              </span>
              <h3 className="text-xs font-bold">Direct Cash to Your UPI</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Once the merchant confirms the order, your cash unlocks. Transfer to PhonePe/GPay at ₹50!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* App Install Strip */}
      <section className="px-4 max-w-5xl mx-auto">
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg shadow-emerald-700/15">
          <div className="space-y-1.5 text-center sm:text-left">
            <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white">
              0 MB Phone Storage
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold">
              Install the CashDeals Web App
            </h2>
            <p className="text-xs text-emerald-100 max-w-md">
              Add to your home screen for instant cashback notifications, 1-tap link conversions, and fast UPI payouts.
            </p>
          </div>

          <Link
            href="/app"
            className="py-3 px-5 rounded-2xl font-bold bg-white text-emerald-800 hover:bg-emerald-50 transition-transform active:scale-95 shadow-md flex items-center gap-2 text-xs flex-shrink-0"
          >
            <Smartphone className="h-4 w-4" />
            Install App
          </Link>
        </div>
      </section>
    </div>
  );
}
