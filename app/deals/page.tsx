import type { Metadata } from "next";
import { db } from "@/lib/db";
import { deals, stores } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ExternalLink, Sparkles, Filter } from "lucide-react";
import Link from "next/link";

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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Trending Cashback Deals
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Click any deal to activate your guaranteed cashback tracking.
        </p>
      </div>

      {/* Categories & Stores Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-border pb-4">
        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 mr-2">
          <Filter className="h-3.5 w-3.5" /> Category:
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
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {deal.storeName}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    {deal.category}
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 leading-snug">
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
                Shop on {deal.storeName}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
