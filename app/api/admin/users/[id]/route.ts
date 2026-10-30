import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { user, clicks, orders, scratchCards, payoutRequests, walletLedger, deals, stores } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
    const userEmail = session?.user?.email?.toLowerCase();

    if (!userEmail || !adminEmails.includes(userEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id: targetUserId } = await params;
    const d = db();

    // 1. Fetch user record
    const targetUser = await d.query.user.findFirst({
      where: eq(user.id, targetUserId),
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Fetch User Click Stream
    const userClicks = await d
      .select({
        id: clicks.id,
        subId: clicks.subId,
        originalUrl: clicks.originalUrl,
        affiliateUrl: clicks.affiliateUrl,
        ipAddress: clicks.ipAddress,
        createdAt: clicks.createdAt,
        dealTitle: deals.title,
        storeName: stores.name,
      })
      .from(clicks)
      .leftJoin(deals, eq(clicks.dealId, deals.id))
      .leftJoin(stores, eq(clicks.storeId, stores.id))
      .where(eq(clicks.userId, targetUserId))
      .orderBy(desc(clicks.createdAt))
      .limit(50);

    // 3. Fetch User Orders
    const userOrders = await d
      .select()
      .from(orders)
      .where(eq(orders.userId, targetUserId))
      .orderBy(desc(orders.createdAt));

    // 4. Fetch User Scratch Cards
    const userScratchCards = await d
      .select()
      .from(scratchCards)
      .where(eq(scratchCards.userId, targetUserId))
      .orderBy(desc(scratchCards.createdAt));

    // 5. Fetch User Payouts
    const userPayouts = await d
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.userId, targetUserId))
      .orderBy(desc(payoutRequests.requestedAt));

    // 6. Fetch Wallet Balance
    const balanceRows = await d
      .select({ total: sql<number>`COALESCE(SUM(${walletLedger.amount}), 0)` })
      .from(walletLedger)
      .where(eq(walletLedger.userId, targetUserId));
    const confirmedBalance = Math.max(0, balanceRows[0]?.total || 0);

    const refCode = targetUserId.slice(0, 8);
    const referralLink = `https://cashdeals.in/sign-up?ref=${refCode}`;

    return NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        createdAt: targetUser.createdAt,
        image: targetUser.image,
        confirmedBalance,
        referralCode: refCode,
        referralLink,
      },
      clicks: userClicks,
      orders: userOrders,
      scratchCards: userScratchCards,
      payouts: userPayouts,
    });
  } catch (err) {
    console.error("Error fetching admin user deep-dive:", err);
    return NextResponse.json({ error: "Failed to fetch user details" }, { status: 500 });
  }
}
