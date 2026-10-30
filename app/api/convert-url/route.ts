import { NextRequest, NextResponse } from "next/server";
import { generateSubId, buildAffiliateUrl } from "@/lib/affiliate";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { clicks } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { url?: string };
    const { url } = body;

    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return NextResponse.json({ error: "Please provide a valid product URL" }, { status: 400 });
    }

    const trimmedUrl = url.trim();
    let store: "Flipkart" | "Amazon" | "Myntra" | "Ajio" | "Other" = "Other";

    if (trimmedUrl.includes("flipkart.com")) store = "Flipkart";
    else if (trimmedUrl.includes("amazon.in") || trimmedUrl.includes("amzn.to") || trimmedUrl.includes("amazon.com")) store = "Amazon";
    else if (trimmedUrl.includes("myntra.com")) store = "Myntra";
    else if (trimmedUrl.includes("ajio.com")) store = "Ajio";

    if (store === "Other") {
      return NextResponse.json(
        { error: "Currently supporting Flipkart, Amazon, Myntra, and Ajio product links." },
        { status: 400 }
      );
    }

    let userId: string | null = null;
    try {
      const session = await getSession();
      if (session?.user) {
        userId = session.user.id;
      }
    } catch {
      // Guest click
    }

    const subId = generateSubId(userId);
    const affiliateUrl = buildAffiliateUrl(trimmedUrl, subId);

    // Record click session in database for attribution
    try {
      const d = db();
      await d.insert(clicks).values({
        id: crypto.randomUUID(),
        subId,
        userId,
        storeId: null,
        dealId: null,
        originalUrl: trimmedUrl,
        affiliateUrl,
        ipAddress: req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for"),
        userAgent: req.headers.get("user-agent"),
        createdAt: new Date(),
      });
    } catch (err) {
      console.error("Failed to log converted link click:", err);
    }

    return NextResponse.json({
      success: true,
      store,
      subId,
      affiliateUrl,
      originalUrl: trimmedUrl,
    });
  } catch (error) {
    console.error("Link conversion error:", error);
    return NextResponse.json(
      { error: "Failed to generate cashback link. Please try again." },
      { status: 500 }
    );
  }
}
