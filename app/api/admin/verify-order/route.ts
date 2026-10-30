import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { user, clicks, orders, walletLedger, scratchCards } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { calculateReward } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
    const userEmail = session?.user?.email?.toLowerCase();

    if (!userEmail || !adminEmails.includes(userEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = (await req.json()) as {
      subId?: string;
      orderNumber?: string;
      storeName?: string;
      orderAmount?: number | string;
      commissionAmount?: number | string;
      userRewardAmount?: number | string;
      userEmailOrId?: string;
    };

    const { subId, orderNumber, storeName, orderAmount, commissionAmount, userRewardAmount, userEmailOrId } = body;

    if (!subId && !userEmailOrId) {
      return NextResponse.json({ error: "Please provide either a SubID or a User Email/ID" }, { status: 400 });
    }

    const d = db();
    let targetUserId: string | null = null;
    let matchedSubId = subId?.trim() || "";

    // 1. Try to find user from clicks table via SubID
    if (subId) {
      const clickRecord = await d.query.clicks.findFirst({
        where: eq(clicks.subId, subId.trim()),
      });
      if (clickRecord?.userId) {
        targetUserId = clickRecord.userId;
      }
    }

    // 2. If not found via click SubID, try finding user directly by email or ID
    if (!targetUserId && userEmailOrId) {
      const userRecord = await d.query.user.findFirst({
        where: or(eq(user.email, userEmailOrId.trim()), eq(user.id, userEmailOrId.trim())),
      });
      if (userRecord) {
        targetUserId = userRecord.id;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: `Could not find a user matching SubID '${subId}' or identifier '${userEmailOrId}'` },
        { status: 404 }
      );
    }

    const ordNum = orderNumber?.trim() || `ORD_${Date.now()}`;
    const store = storeName?.trim() || "Amazon";
    const ordAmt = orderAmount ? parseFloat(String(orderAmount)) : 1000;
    const commAmt = commissionAmount ? parseFloat(String(commissionAmount)) : 60;
    const reward = userRewardAmount ? parseFloat(String(userRewardAmount)) : calculateReward(commAmt);

    const orderId = `ord_${crypto.randomUUID().slice(0, 8)}`;

    // 3. Insert Confirmed Order Record
    await d.insert(orders).values({
      id: orderId,
      orderNumber: ordNum,
      subId: matchedSubId || `manual_${targetUserId.slice(0, 6)}`,
      userId: targetUserId,
      storeName: store,
      orderAmount: ordAmt,
      commissionAmount: commAmt,
      userRewardAmount: reward,
      status: "CONFIRMED",
      reconciledAt: new Date(),
      createdAt: new Date(),
    });

    // 4. Credit User Confirmed Wallet Ledger
    await d.insert(walletLedger).values({
      id: crypto.randomUUID(),
      userId: targetUserId,
      type: "SCRATCH_REWARD",
      amount: reward,
      status: "CONFIRMED",
      referenceId: orderId,
      description: `Cashback verified for ${store} Order #${ordNum}`,
      createdAt: new Date(),
    });

    // 5. Create Scratch Card Record
    await d.insert(scratchCards).values({
      id: crypto.randomUUID(),
      userId: targetUserId,
      orderId,
      rewardAmount: reward,
      title: `${store} Verified Cashback`,
      isRevealed: true,
      revealedAt: new Date(),
      createdAt: new Date(),
    });

    const targetUserRecord = await d.query.user.findFirst({
      where: eq(user.id, targetUserId),
    });

    return NextResponse.json({
      success: true,
      message: `Verified! ₹${reward.toFixed(2)} cashback credited to ${targetUserRecord?.email || targetUserId}.`,
      order: {
        orderId,
        orderNumber: ordNum,
        store,
        userRewardAmount: reward,
        userEmail: targetUserRecord?.email,
      },
    });
  } catch (err) {
    console.error("Error verifying order:", err);
    return NextResponse.json({ error: "Failed to verify order" }, { status: 500 });
  }
}
