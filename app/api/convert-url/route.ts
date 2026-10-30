import { NextRequest, NextResponse } from "next/server";
import { fetchProductMetadata, generateSubId, buildAffiliateUrl } from "@/lib/affiliate";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { clicks } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { url?: string };
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Please provide a valid URL" }, { status: 400 });
    }

    const trimmedUrl = url.trim();
    if (
      !trimmedUrl.includes("flipkart.com") &&
      !trimmedUrl.includes("amazon.in") &&
      !trimmedUrl.includes("amzn.to") &&
      !trimmedUrl.includes("myntra.com") &&
      !trimmedUrl.includes("ajio.com")
    ) {
      return NextResponse.json(
        { error: "Currently supporting Flipkart, Amazon, Myntra, and Ajio links." },
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
      // Guest
    }

    const subId = generateSubId(userId);
    const affiliateUrl = buildAffiliateUrl(trimmedUrl, subId);
    const metadata = await fetchProductMetadata(trimmedUrl);

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
      title: metadata.title,
      imageUrl: metadata.imageUrl,
      price: metadata.price,
      store: metadata.store,
      subId,
      affiliateUrl,
    });
  } catch (error) {
    console.error("Link conversion error:", error);
    return NextResponse.json(
      { error: "Failed to parse product link. Please try again." },
      { status: 500 }
    );
  }
}
