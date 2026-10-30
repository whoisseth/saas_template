import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { clicks, orders, scratchCards } from "@/db/schema";
import { calculateReward } from "@/lib/affiliate";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
    const userEmail = session?.user?.email?.toLowerCase();

    if (!userEmail || !adminEmails.includes(userEmail)) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Please upload an Earnly CSV report file" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV file is empty or missing headers" }, { status: 400 });
    }

    const headersList = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
    
    // Auto-detect columns from Earnly / generic affiliate report
    const subIdIdx = headersList.findIndex((h) => h.includes("subid") || h.includes("sub_id") || h.includes("tag"));
    const orderIdIdx = headersList.findIndex((h) => h.includes("order") || h.includes("transaction") || h.includes("id"));
    const storeIdx = headersList.findIndex((h) => h.includes("store") || h.includes("merchant") || h.includes("platform"));
    const amountIdx = headersList.findIndex((h) => h.includes("amount") || h.includes("sale") || h.includes("price"));
    const commIdx = headersList.findIndex((h) => h.includes("commission") || h.includes("payout") || h.includes("earn"));
    const statusIdx = headersList.findIndex((h) => h.includes("status"));

    if (subIdIdx === -1) {
      return NextResponse.json(
        { error: "Could not find 'SubID' column in CSV. Please verify Earnly format." },
        { status: 400 }
      );
    }

    const d = db();
    let matchedCount = 0;
    let scratchCardsIssued = 0;
    let skippedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const rawSubId = cols[subIdIdx];
      if (!rawSubId) continue;

      const orderNumber = orderIdIdx !== -1 ? cols[orderIdIdx] || `ORD_${Date.now()}_${i}` : `ORD_${i}`;
      const storeName = storeIdx !== -1 ? cols[storeIdx] || "Flipkart" : "Flipkart";
      const orderAmount = amountIdx !== -1 ? parseFloat(cols[amountIdx]) || 0 : 0;
      const commissionAmount = commIdx !== -1 ? parseFloat(cols[commIdx]) || 0 : 0;
      const rawStatus = (statusIdx !== -1 ? cols[statusIdx] : "approved").toLowerCase();

      // Check click record to find user
      const matchedClicks = await d
        .select()
        .from(clicks)
        .where(eq(clicks.subId, rawSubId))
        .limit(1);

      const click = matchedClicks[0];
      if (!click || !click.userId) {
        skippedCount++;
        continue;
      }

      matchedCount++;

      const isApproved =
        rawStatus.includes("approved") ||
        rawStatus.includes("confirmed") ||
        rawStatus.includes("paid") ||
        rawStatus.includes("success");

      const isCancelled =
        rawStatus.includes("cancel") ||
        rawStatus.includes("reject") ||
        rawStatus.includes("returned");

      const orderStatus = isCancelled ? "CANCELLED" : isApproved ? "CONFIRMED" : "TRACKED";
      const reward = isApproved ? calculateReward(commissionAmount) : 0;

      // Upsert order
      const orderId = crypto.randomUUID();
      await d.insert(orders).values({
        id: orderId,
        orderNumber,
        subId: rawSubId,
        userId: click.userId,
        storeName,
        orderAmount,
        commissionAmount,
        userRewardAmount: reward,
        status: orderStatus,
        reconciledAt: new Date(),
        expectedConfirmationDate: "Within 15 days",
        createdAt: new Date(),
      });

      // If Confirmed and reward > 0, issue an unrevealed scratch card
      if (orderStatus === "CONFIRMED" && reward > 0) {
        await d.insert(scratchCards).values({
          id: crypto.randomUUID(),
          userId: click.userId,
          orderId,
          rewardAmount: reward,
          title: `${storeName} Cashback Reward`,
          isRevealed: false,
          createdAt: new Date(),
        });
        scratchCardsIssued++;
      }
    }

    return NextResponse.json({
      success: true,
      matched: matchedCount,
      scratchCardsIssued,
      skipped: skippedCount,
      message: `Reconciliation complete! Matched ${matchedCount} orders and issued ${scratchCardsIssued} scratch cards.`,
    });
  } catch (error) {
    console.error("Reconciliation error:", error);
    return NextResponse.json(
      { error: "Failed to process reconciliation report." },
      { status: 500 }
    );
  }
}
