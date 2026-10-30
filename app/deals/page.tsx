import type { Metadata } from "next";
import { db } from "@/lib/db";
import { deals, stores } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Filter, ArrowLeft, Sparkles, LayoutDashboard, Smartphone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { DealCard } from "@/components/deal-card";
import { getSession } from "@/lib/session";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export const metadata: Metadata = {
  title: "Trending Cashback Deals | CashDeals",
  description: "Browse top discounts on smartphones, fashion, shoes, and headphones with guaranteed cashback.",
};

export const dynamic = "force-dynamic";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; store?: string }>;
}) {
  const { category, store } = await searchParams;
  const session = await getSession();
  const d = db();

  const allDeals = await d
    .select({
      id: deals.id,
      title: deals.title,
      originalPrice: deals.originalPrice,
      discountedPrice: deals.discountedPrice,
      discountPercent: deals.discountPercent,
      imageUrl: deals.imageUrl,
      targetUrl: deals.targetUrl,
      cashbackEstimate: deals.cashbackEstimate,
      category: deals.category,
      storeName: stores.name,
      storeLogo: stores.logoUrl,
    })
    .from(deals)
    .leftJoin(stores, eq(deals.storeId, stores.id))
    .where(eq(deals.isActive, true))
    .orderBy(desc(deals.isFeatured), desc(deals.clicksCount))
    .limit(40);

  const filtered = allDeals.filter((d) => {
    if (category && category !== "all" && d.category.toLowerCase() !== category.toLowerCase()) {
      return false;
    }
    if (store && store !== "all" && d.storeName?.toLowerCase() !== store.toLowerCase()) {
      return false;
    }
    return true;
  });

  const categories = ["All", "Electronics", "Fashion"];
  const storeFilters = ["All", "Flipkart", "Amazon", "Myntra", "Ajio"];

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
            {!session?.user ? (
              <Link
                href="/sign-in?callbackUrl=/deals"
                className="px-3 py-1.5 rounded-xl font-semibold border border-border hover:bg-muted text-xs transition-colors"
              >
                Sign In
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="h-8 w-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center"
              >
                {session.user.name?.slice(0, 1) || session.user.email?.slice(0, 1).toUpperCase()}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6 flex-1 w-full">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Live Affiliate Deals
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Verified Cashback
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Trending Cashback Deals
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Tap &apos;Shop on Merchant&apos; to link your purchase and unlock your guaranteed ₹1–₹20 scratch card upon delivery.
          </p>
        </div>

        {/* Categories & Stores Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-border pb-4">
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 mr-1">
            <Filter className="h-3.5 w-3.5" /> Filter:
          </span>
          {categories.map((c) => {
            const isActive = (!category && c === "All") || category?.toLowerCase() === c.toLowerCase();
            return (
              <Link
                key={c}
                href={`/deals?category=${c.toLowerCase()}${store ? `&store=${store}` : ""}`}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {c}
              </Link>
            );
          })}
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {filtered.map((deal) => (
            <DealCard
              key={deal.id}
              id={deal.id}
              title={deal.title}
              originalPrice={deal.originalPrice}
              discountedPrice={deal.discountedPrice}
              discountPercent={deal.discountPercent}
              imageUrl={deal.imageUrl}
              targetUrl={deal.targetUrl}
              cashbackEstimate={deal.cashbackEstimate}
              category={deal.category}
              storeName={deal.storeName || "Flipkart"}
              isLoggedIn={Boolean(session?.user)}
            />
          ))}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
