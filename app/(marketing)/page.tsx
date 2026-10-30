import Link from "next/link";
import { db } from "@/lib/db";
import { stores, deals } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { LinkConverterBox } from "@/components/link-converter-box";
import {
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Gift,
  CheckCircle2,
  Smartphone,
  Trophy,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const d = db();

  // Load active stores
  let allStores: Array<typeof stores.$inferSelect> = [];
  try {
    allStores = await d
      .select()
      .from(stores)
      .where(eq(stores.isActive, true))
      .limit(6);
  } catch (err) {
    console.error("Error loading stores:", err);
  }

  // Load featured deals
  let trendingDeals: Array<typeof deals.$inferSelect> = [];
  try {
    trendingDeals = await d
      .select()
      .from(deals)
      .where(eq(deals.isActive, true))
      .orderBy(desc(deals.isFeatured), desc(deals.clicksCount))
      .limit(8);
  } catch (err) {
    console.error("Error loading deals:", err);
  }

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-12 px-4 max-w-6xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-300">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Earn Extra Guaranteed Cash on Every Flipkart & Amazon Order</span>
        </div>

        <div className="space-y-3 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Shop Online. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
              Earn Instant Scratch Cards.
            </span>
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground max-w-xl mx-auto">
            Never shop without rewards again. Unlock guaranteed random ₹1–₹20 scratch cards and withdraw directly to your PhonePe or Google Pay UPI ID.
          </p>
        </div>

        {/* Live Link Converter Hero Tool */}
        <div className="pt-2">
          <LinkConverterBox />
        </div>
      </section>

      {/* Top Stores Quick Access */}
      <section className="px-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-500" />
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              Top Partner Stores
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Verified Commissions
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {allStores.map((store) => (
            <a
              key={store.id}
              href={`/api/redirect?url=${encodeURIComponent(store.affiliateBaseUrl)}&storeId=${store.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl border border-border bg-card/60 hover:bg-card hover:border-emerald-500/50 hover:shadow-md transition-all group flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="h-10 w-24 flex items-center justify-center mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={store.logoUrl}
                  alt={store.name}
                  className="max-h-7 max-w-full object-contain filter group-hover:scale-105 transition-transform"
                />
              </div>
              <span className="text-xs font-bold text-foreground">{store.name}</span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {store.cashbackText}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 opacity-80 group-hover:opacity-100">
                Shop Now <ExternalLink className="h-2.5 w-2.5" />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Trending Deals Section */}
      <section className="px-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              Trending Handpicked Deals
            </h2>
          </div>
          <Link
            href="/deals"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {trendingDeals.map((deal) => (
            <div
              key={deal.id}
              className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-emerald-500/40 transition-all flex flex-col group"
            >
              <div className="relative aspect-square w-full bg-muted overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={deal.imageUrl}
                  alt={deal.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-rose-600 text-white shadow-sm">
                  {deal.discountPercent}% OFF
                </span>
                {deal.cashbackEstimate && (
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-600 text-white shadow-sm">
                    {deal.cashbackEstimate}
                  </span>
                )}
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                    {deal.category}
                  </span>
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 mt-0.5 leading-snug">
                    {deal.title}
                  </h3>
                </div>

                <div className="pt-2 border-t border-border flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm sm:text-base font-extrabold text-foreground">
                      ₹{deal.discountedPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-muted-foreground line-through">
                      ₹{deal.originalPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <a
                  href={`/api/redirect?url=${encodeURIComponent(deal.targetUrl)}&dealId=${deal.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95"
                >
                  Shop & Earn
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3-Step "How It Works" Section */}
      <section className="px-4 max-w-6xl mx-auto">
        <div className="rounded-3xl border border-border bg-muted/30 p-6 sm:p-10 space-y-8">
          <div className="text-center space-y-2 max-w-md mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Simple 3-Step Flow
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold">How CashDeals Works</h2>
            <p className="text-xs text-muted-foreground">
              Guaranteed real cash rewards in 3 easy steps. No coupon gimmicks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-card border border-border text-center space-y-3 shadow-sm">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-extrabold text-lg">
                1
              </div>
              <h3 className="text-sm font-bold">Pick Deal or Paste Link</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Browse our curated deals or paste any link from Flipkart, Amazon, or Myntra to activate tracking.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border text-center space-y-3 shadow-sm">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-extrabold text-lg">
                2
              </div>
              <h3 className="text-sm font-bold">Shop Normally</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Complete your order on the merchant app or website. Our system tracks your order automatically via SubID.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border text-center space-y-3 shadow-sm">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-extrabold text-lg">
                3
              </div>
              <h3 className="text-sm font-bold">Scratch & Withdraw UPI</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Unlock your random ₹1–₹20 scratch card once the return window passes, and transfer money directly to your UPI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* App Install Banner CTA */}
      <section className="px-4 max-w-6xl mx-auto pb-8">
        <div className="rounded-3xl p-6 sm:p-10 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-emerald-700/20">
          <div className="space-y-2 text-center sm:text-left">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm">
              0 MB Phone Storage
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Get the CashDeals Mobile App
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-md">
              Add to your home screen with 1 tap. Enjoy native app performance, instant scratch card notifications, and deal alerts.
            </p>
          </div>

          <Link
            href="/app"
            className="py-3 px-6 rounded-2xl font-bold bg-white text-emerald-800 hover:bg-emerald-50 transition-transform active:scale-95 shadow-md flex items-center gap-2 text-xs sm:text-sm flex-shrink-0"
          >
            <Smartphone className="h-4 w-4" />
            Install Web App
          </Link>
        </div>
      </section>
    </div>
  );
}
