import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { orders, scratchCards, walletLedger, payoutRequests } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { WalletView } from "./wallet-view";
import Link from "next/link";
import { LogIn, ArrowLeft, Sparkles, LayoutDashboard } from "lucide-react";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export const metadata: Metadata = {
  title: "My Wallet & Rewards | CashDeals",
  description: "Track your pending cashback, scratch cards, and request direct UPI payouts.",
};

export default async function WalletPage() {
  const session = await getSession();

  if (!session?.user) {
    return (
      <main className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full rounded-3xl border border-border bg-card p-8 shadow-xl space-y-4">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <LogIn className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Login to View Your Wallet</h1>
          <p className="text-xs text-muted-foreground">
            Sign in to check your confirmed cashback, scratch your unlocked reward cards, and withdraw money via UPI.
          </p>
          <Link
            href="/sign-in?callbackUrl=/wallet"
            className="block w-full py-3.5 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition-all active:scale-95 text-sm"
          >
            Sign In with Google / Account
          </Link>
        </div>
      </main>
    );
  }

  const d = db();

  const balanceRows = await d
    .select({
      total: sql<number>`COALESCE(SUM(${walletLedger.amount}), 0)`,
    })
    .from(walletLedger)
    .where(eq(walletLedger.userId, session.user.id));
  const confirmedBalance = Math.max(0, balanceRows[0]?.total || 0);

  const pendingRows = await d
    .select({
      total: sql<number>`COALESCE(SUM(${orders.userRewardAmount}), 0)`,
    })
    .from(orders)
    .where(and(eq(orders.userId, session.user.id), eq(orders.status, "TRACKED")));
  const pendingCashback = pendingRows[0]?.total || 0;

  const userScratchCards = await d
    .select()
    .from(scratchCards)
    .where(eq(scratchCards.userId, session.user.id))
    .orderBy(desc(scratchCards.createdAt));

  const userOrders = await d
    .select()
    .from(orders)
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt))
    .limit(20);

  const userPayouts = await d
    .select()
    .from(payoutRequests)
    .where(eq(payoutRequests.userId, session.user.id))
    .orderBy(desc(payoutRequests.requestedAt))
    .limit(10);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20 sm:pb-12">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
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
              href="/#convert"
              className="px-3 py-1.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95"
            >
              <Sparkles className="h-3 w-3" />
              <span>+ Earn Cashback</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8 flex-1 w-full">
        <WalletView
          user={session.user}
          confirmedBalance={confirmedBalance}
          pendingCashback={pendingCashback}
          scratchCards={userScratchCards}
          orders={userOrders}
          payouts={userPayouts}
        />
      </main>

      <MobileBottomNav />
    </div>
  );
}
