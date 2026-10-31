import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { user, session as sessionTable, clicks, deals, stores, orders, walletLedger, scratchCards } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentSession = await getSession();
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
    const userEmail = currentSession?.user?.email?.toLowerCase();
    const isPreview = process.env.NEXT_PUBLIC_IS_PREVIEW === "true" || process.env.NODE_ENV === "development";

    if (!isPreview && (!userEmail || !adminEmails.includes(userEmail))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const d = db();

    // 1. Fetch all users
    const allUsers = await d
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        image: user.image,
      })
      .from(user)
      .orderBy(desc(user.createdAt));

    // For each user, attach their orders count, wallet balance, and scratch card count
    const usersWithStats = await Promise.all(
      allUsers.map(async (u) => {
        const orderCountResult = await d
          .select({ count: sql<number>`COUNT(*)` })
          .from(orders)
          .where(eq(orders.userId, u.id));

        const balanceResult = await d
          .select({ total: sql<number>`COALESCE(SUM(${walletLedger.amount}), 0)` })
          .from(walletLedger)
          .where(eq(walletLedger.userId, u.id));

        const scratchCountResult = await d
          .select({ count: sql<number>`COUNT(*)` })
          .from(scratchCards)
          .where(eq(scratchCards.userId, u.id));

        const latestSession = await d
          .select({ updatedAt: sessionTable.updatedAt, ipAddress: sessionTable.ipAddress })
          .from(sessionTable)
          .where(eq(sessionTable.userId, u.id))
          .orderBy(desc(sessionTable.updatedAt))
          .limit(1);

        return {
          ...u,
          ordersCount: orderCountResult[0]?.count || 0,
          confirmedBalance: Math.max(0, balanceResult[0]?.total || 0),
          scratchCardsCount: scratchCountResult[0]?.count || 0,
          lastActiveAt: latestSession[0]?.updatedAt || null,
        };
      })
    );

    // 2. Fetch all deals ordered by clicksCount
    const allDeals = await d
      .select({
        id: deals.id,
        title: deals.title,
        originalPrice: deals.originalPrice,
        discountedPrice: deals.discountedPrice,
        discountPercent: deals.discountPercent,
        clicksCount: deals.clicksCount,
        category: deals.category,
        isActive: deals.isActive,
        isFeatured: deals.isFeatured,
        imageUrl: deals.imageUrl,
        targetUrl: deals.targetUrl,
        storeName: stores.name,
        storeLogo: stores.logoUrl,
      })
      .from(deals)
      .leftJoin(stores, eq(deals.storeId, stores.id))
      .orderBy(desc(deals.clicksCount));

    // 3. Fetch latest 25 click events
    const recentClicks = await d
      .select({
        id: clicks.id,
        subId: clicks.subId,
        originalUrl: clicks.originalUrl,
        affiliateUrl: clicks.affiliateUrl,
        ipAddress: clicks.ipAddress,
        createdAt: clicks.createdAt,
        userId: clicks.userId,
        userName: user.name,
        userEmail: user.email,
        dealTitle: deals.title,
      })
      .from(clicks)
      .leftJoin(user, eq(clicks.userId, user.id))
      .leftJoin(deals, eq(clicks.dealId, deals.id))
      .orderBy(desc(clicks.createdAt))
      .limit(25);

    // 4. Total clicks count
    const totalClicksResult = await d
      .select({ count: sql<number>`COUNT(*)` })
      .from(clicks);

    return NextResponse.json({
      success: true,
      users: usersWithStats,
      deals: allDeals,
      recentClicks,
      totalClicks: totalClicksResult[0]?.count || 0,
    });
  } catch (err) {
    console.error("Error fetching admin overview:", err);
    return NextResponse.json({ error: "Failed to fetch overview" }, { status: 500 });
  }
}
