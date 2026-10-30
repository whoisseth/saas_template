import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { walletLedger, payoutRequests } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { check as checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Please log in to request a payout" }, { status: 401 });
    }

    const rl = await checkRateLimit({
      bucket: "payout_req",
      subject: session.user.id,
      limit: 3,
      windowSec: 3600,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many withdrawal requests. Please wait a bit before trying again." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as { upiId?: string; amount?: number };
    const { upiId, amount } = body;
    const cleanUpi = typeof upiId === "string" ? upiId.trim().toLowerCase() : "";
    const numAmount = Number(amount);

    if (!cleanUpi || !UPI_REGEX.test(cleanUpi)) {
      return NextResponse.json(
        { error: "Please enter a valid UPI ID (e.g. mobile@paytm, name@okaxis)" },
        { status: 400 }
      );
    }

    if (isNaN(numAmount) || numAmount < 50) {
      return NextResponse.json(
        { error: "Minimum withdrawal threshold is ₹50" },
        { status: 400 }
      );
    }

    const d = db();

    const ledgerRows = await d
      .select({
        total: sql<number>`COALESCE(SUM(${walletLedger.amount}), 0)`,
      })
      .from(walletLedger)
      .where(eq(walletLedger.userId, session.user.id));

    const currentBalance = ledgerRows[0]?.total || 0;
    if (currentBalance < numAmount) {
      return NextResponse.json(
        { error: `Insufficient wallet balance. You have ₹${currentBalance.toFixed(2)} available.` },
        { status: 400 }
      );
    }

    const existingPayer = await d
      .select({ id: payoutRequests.id, userId: payoutRequests.userId })
      .from(payoutRequests)
      .where(eq(payoutRequests.upiId, cleanUpi))
      .limit(1);

    if (existingPayer[0] && existingPayer[0].userId !== session.user.id) {
      return NextResponse.json(
        { error: "This UPI ID is already associated with another user account." },
        { status: 400 }
      );
    }

    const payoutId = crypto.randomUUID();

    await d.insert(walletLedger).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      type: "WITHDRAWAL_LOCK",
      amount: -numAmount,
      status: "CONFIRMED",
      referenceId: payoutId,
      description: `UPI Withdrawal Request to ${cleanUpi}`,
      createdAt: new Date(),
    });

    await d.insert(payoutRequests).values({
      id: payoutId,
      userId: session.user.id,
      amount: numAmount,
      upiId: cleanUpi,
      status: "PENDING",
      requestedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      payoutId,
      message: `Withdrawal request for ₹${numAmount} submitted successfully! Your payment will be sent to ${cleanUpi} within 24-48 hours.`,
    });
  } catch (error) {
    console.error("Payout request error:", error);
    return NextResponse.json(
      { error: "Failed to process withdrawal request. Please try again." },
      { status: 500 }
    );
  }
}
