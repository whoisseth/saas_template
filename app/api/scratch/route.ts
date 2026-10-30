import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { scratchCards, walletLedger } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Please log in to claim your reward" }, { status: 401 });
    }

    const body = (await req.json()) as { scratchCardId?: string };
    const { scratchCardId } = body;
    if (!scratchCardId) {
      return NextResponse.json({ error: "Missing scratchCardId" }, { status: 400 });
    }

    const d = db();
    const cards = await d
      .select()
      .from(scratchCards)
      .where(
        and(
          eq(scratchCards.id, scratchCardId),
          eq(scratchCards.userId, session.user.id),
          eq(scratchCards.isRevealed, false)
        )
      )
      .limit(1);

    const card = cards[0];
    if (!card) {
      return NextResponse.json(
        { error: "Scratch card already revealed or not found" },
        { status: 404 }
      );
    }

    await d
      .update(scratchCards)
      .set({
        isRevealed: true,
        revealedAt: new Date(),
      })
      .where(eq(scratchCards.id, card.id));

    await d.insert(walletLedger).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      type: "SCRATCH_REWARD",
      amount: card.rewardAmount,
      status: "CONFIRMED",
      referenceId: card.id,
      description: `Shopping Cashback Reward - ₹${card.rewardAmount}`,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      amount: card.rewardAmount,
      message: `Congratulations! ₹${card.rewardAmount} credited to your wallet.`,
    });
  } catch (error) {
    console.error("Scratch reveal error:", error);
    return NextResponse.json(
      { error: "Failed to process scratch card reward." },
      { status: 500 }
    );
  }
}
