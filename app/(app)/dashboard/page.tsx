import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { orders, scratchCards, walletLedger, payoutRequests, user } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { DashboardView } from "./dashboard-view";

export const metadata: Metadata = {
  title: "User Dashboard | CashDeals",
  description: "Track your cashback, unlock scratch cards, convert shopping links, and manage UPI payouts.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/dashboard");
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  const isAdmin = Boolean(session.user.email && adminEmails.includes(session.user.email.toLowerCase()));

  const d = db();

  // 1. Confirmed balance
  const balanceRows = await d
    .select({
      total: sql<number>`COALESCE(SUM(${walletLedger.amount}), 0)`,
    })
    .from(walletLedger)
    .where(eq(walletLedger.userId, session.user.id));
  const confirmedBalance = Math.max(0, balanceRows[0]?.total || 0);

  // 2. Pending cashback in review
  const pendingRows = await d
    .select({
      total: sql<number>`COALESCE(SUM(${orders.userRewardAmount}), 0)`,
    })
    .from(orders)
    .where(eq(orders.userId, session.user.id));
  const pendingCashback = pendingRows[0]?.total || 0;

  // 3. Scratch cards
  const userCards = await d
    .select()
    .from(scratchCards)
    .where(eq(scratchCards.userId, session.user.id))
    .orderBy(desc(scratchCards.createdAt));

  // 4. Shopping Orders
  const userOrders = await d
    .select()
    .from(orders)
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt))
    .limit(20);

  // 5. UPI Payouts
  const userPayouts = await d
    .select()
    .from(payoutRequests)
    .where(eq(payoutRequests.userId, session.user.id))
    .orderBy(desc(payoutRequests.requestedAt))
    .limit(10);

  // 6. Lifetime earned
  const lifetimeRows = await d
    .select({
      total: sql<number>`COALESCE(SUM(${walletLedger.amount}), 0)`,
    })
    .from(walletLedger)
    .where(
      sql`${walletLedger.userId} = ${session.user.id} AND ${walletLedger.amount} > 0`
    );
  const lifetimeEarned = lifetimeRows[0]?.total || 0;

  return (
    <DashboardView
      user={session.user}
      isAdmin={isAdmin}
      confirmedBalance={confirmedBalance}
      pendingCashback={pendingCashback}
      lifetimeEarned={lifetimeEarned}
      scratchCards={userCards}
      orders={userOrders}
      payouts={userPayouts}
    />
  );
}
