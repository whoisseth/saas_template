import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { payoutRequests, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();

    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
    const userEmail = session?.user?.email?.toLowerCase();

    if (!userEmail || !adminEmails.includes(userEmail)) {
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

    if (!userEmail || !adminEmails.includes(userEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = (await req.json()) as { payoutId?: string; utrReference?: string; action?: string };
    const { payoutId, utrReference, action } = body;

    if (!payoutId || !utrReference) {
      return NextResponse.json(
        { error: "Payout ID and 12-digit UTR reference number are required" },
        { status: 400 }
      );
    }

    const d = db();
    await d
      .update(payoutRequests)
      .set({
        status: action === "reject" ? "REJECTED" : "PAID",
        utrReference: utrReference.trim(),
        processedAt: new Date(),
      })
      .where(eq(payoutRequests.id, payoutId));

    return NextResponse.json({
      success: true,
      message: `Payout marked as ${action === "reject" ? "REJECTED" : "PAID"} with UTR: ${utrReference}`,
    });
  } catch (error) {
    console.error("Update payout error:", error);
    return NextResponse.json({ error: "Failed to update payout" }, { status: 500 });
  }
}
