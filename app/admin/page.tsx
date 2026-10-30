import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { orders, payoutRequests, user } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { AdminView } from "./admin-view";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Portal | CashDeals",
  description: "Manage Earnly CSV reconciliation, manual UPI payouts with QR code, and curated deals.",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();

  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  const userEmail = session?.user?.email?.toLowerCase();

  const isAuthorized = userEmail && adminEmails.includes(userEmail);

  if (!isAuthorized) {
    return (
      <main className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full rounded-3xl border border-border bg-card p-8 shadow-xl space-y-4">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Authorization Required</h1>
          <p className="text-xs text-muted-foreground">
            You must be signed in with an authorized admin email (e.g. {adminEmails[0] || "configured in .env"}).
          </p>
          <Link
            href="/sign-in?callbackUrl=/admin"
            className="block w-full py-3.5 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-all active:scale-95 text-sm"
          >
            Sign In with Admin Account
          </Link>
        </div>
      </main>
    );
  }

  const d = db();

  // Metrics
  const orderStats = await d
    .select({
      totalCount: sql<number>`COUNT(*)`,
      totalVolume: sql<number>`COALESCE(SUM(${orders.orderAmount}), 0)`,
      totalCommission: sql<number>`COALESCE(SUM(${orders.commissionAmount}), 0)`,
    })
    .from(orders);

  const pendingPayouts = await d
    .select({
      count: sql<number>`COUNT(*)`,
      amount: sql<number>`COALESCE(SUM(${payoutRequests.amount}), 0)`,
    })
    .from(payoutRequests)
    .where(eq(payoutRequests.status, "PENDING"));

  const userCount = await d.select({ count: sql<number>`COUNT(*)` }).from(user);

  return (
    <main className="min-h-screen py-8 px-4 max-w-6xl mx-auto">
      <AdminView
        metrics={{
          ordersCount: orderStats[0]?.totalCount || 0,
          ordersVolume: orderStats[0]?.totalVolume || 0,
          totalCommission: orderStats[0]?.totalCommission || 0,
          pendingPayoutsCount: pendingPayouts[0]?.count || 0,
          pendingPayoutsAmount: pendingPayouts[0]?.amount || 0,
          totalUsers: userCount[0]?.count || 0,
        }}
      />
    </main>
  );
}
