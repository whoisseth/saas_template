import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { payoutRequests, user, walletLedger } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();

    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
    const userEmail = session?.user?.email?.toLowerCase();
    const isPreview = process.env.NEXT_PUBLIC_IS_PREVIEW === "true" || process.env.NODE_ENV === "development";

    if (!isPreview && (!userEmail || !adminEmails.includes(userEmail))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const d = db();
    const rows = await d
      .select({
        id: payoutRequests.id,
        userId: payoutRequests.userId,
        amount: payoutRequests.amount,
        upiId: payoutRequests.upiId,
        status: payoutRequests.status,
        utrReference: payoutRequests.utrReference,
        adminNotes: payoutRequests.adminNotes,
        requestedAt: payoutRequests.requestedAt,
        processedAt: payoutRequests.processedAt,
        userName: user.name,
        userEmail: user.email,
      })
      .from(payoutRequests)
      .leftJoin(user, eq(payoutRequests.userId, user.id))
      .orderBy(desc(payoutRequests.requestedAt))
      .limit(100);

    const enriched = await Promise.all(
      rows.map(async (row) => {
        let qrCodeDataUrl: string | null = null;
        if (row.status === "PENDING") {
          const upiUri = `upi://pay?pa=${encodeURIComponent(row.upiId)}&pn=CashDealsUser&am=${row.amount}&cu=INR&tn=CashDeals+Cashback+Payout`;
          try {
            qrCodeDataUrl = await QRCode.toDataURL(upiUri, {
              width: 180,
              margin: 1,
            });
          } catch {
            // Graceful fallback
          }
        }
        return {
          ...row,
          qrCodeDataUrl,
        };
      })
    );

    return NextResponse.json({ success: true, payouts: enriched });
  } catch (error) {
    console.error("Fetch payouts error:", error);
    return NextResponse.json({ error: "Failed to load payouts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
    const userEmail = session?.user?.email?.toLowerCase();
    const isPreview = process.env.NEXT_PUBLIC_IS_PREVIEW === "true" || process.env.NODE_ENV === "development";

    if (!isPreview && (!userEmail || !adminEmails.includes(userEmail))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = (await req.json()) as { payoutId?: string; utrReference?: string; action?: string };
    const { payoutId, utrReference, action } = body;

    if (!payoutId) {
      return NextResponse.json({ error: "Payout ID is required" }, { status: 400 });
    }

    const d = db();
    const existingReq = await d
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.id, payoutId))
      .limit(1);

    if (!existingReq[0]) {
      return NextResponse.json({ error: "Payout request not found" }, { status: 404 });
    }

    const currentReq = existingReq[0];

    if (currentReq.status === "PAID") {
      return NextResponse.json({ error: "This payout has already been marked as PAID" }, { status: 400 });
    }

    if (action === "reject") {
      const reason = utrReference?.trim() || "Rejected by admin";
      await d
        .update(payoutRequests)
        .set({
          status: "REJECTED",
          utrReference: reason,
          adminNotes: `Rejected by admin: ${reason}`,
          processedAt: new Date(),
        })
        .where(eq(payoutRequests.id, payoutId));

      // Refund the locked amount back to user's walletLedger
      await d.insert(walletLedger).values({
        id: crypto.randomUUID(),
        userId: currentReq.userId,
        type: "REFUND",
        amount: currentReq.amount,
        status: "CONFIRMED",
        referenceId: payoutId,
        description: `Refund for rejected UPI payout (${currentReq.upiId})`,
        createdAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: `Payout rejected and ₹${currentReq.amount.toFixed(2)} refunded to user wallet.`,
      });
    }

    // Default: Mark as PAID
    if (!utrReference || utrReference.trim().length < 6) {
      return NextResponse.json(
        { error: "A valid 12-digit UPI UTR reference number is required to mark paid" },
        { status: 400 }
      );
    }

    await d
      .update(payoutRequests)
      .set({
        status: "PAID",
        utrReference: utrReference.trim(),
        processedAt: new Date(),
      })
      .where(eq(payoutRequests.id, payoutId));

    // Audit record in ledger
    await d.insert(walletLedger).values({
      id: crypto.randomUUID(),
      userId: currentReq.userId,
      type: "WITHDRAWAL_PAID",
      amount: 0,
      status: "CONFIRMED",
      referenceId: payoutId,
      description: `UPI Payout Confirmed (UTR: ${utrReference.trim()})`,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Payout of ₹${currentReq.amount.toFixed(2)} marked PAID with UTR: ${utrReference.trim()}`,
    });
  } catch (error) {
    console.error("Update payout error:", error);
    return NextResponse.json({ error: "Failed to update payout" }, { status: 500 });
  }
}
