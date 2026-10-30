import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { deals, stores } from "@/db/schema";
import { fetchProductMetadata } from "@/lib/affiliate";
import { eq } from "drizzle-orm";

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
      url?: string;
      category?: string;
      customTitle?: string;
      customPrice?: string | number;
    };
    const { url, category, customTitle, customPrice } = body;

    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return NextResponse.json({ error: "Please enter a valid product URL" }, { status: 400 });
    }

    // Extract product details
    const meta = await fetchProductMetadata(url);

    const d = db();

    // Match store
    const storeSlug = meta.store.toLowerCase();
    let storeRecord = await d.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
    });

    if (!storeRecord) {
      // Fallback to Flipkart or first active store
      storeRecord = await d.query.stores.findFirst({
        where: eq(stores.isActive, true),
      });
    }

    if (!storeRecord) {
      return NextResponse.json({ error: "No active store found for deal" }, { status: 400 });
    }

    const price = customPrice ? parseFloat(String(customPrice)) : meta.price || 999;
    const originalPrice = Math.round(price * 1.35); // 26% discount default
    const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);

    const dealId = `deal_${crypto.randomUUID().slice(0, 8)}`;
    const slug = `${dealId}-${(customTitle || meta.title).slice(0, 30).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    await d.insert(deals).values({
      id: dealId,
      storeId: storeRecord.id,
      title: (customTitle || meta.title).slice(0, 150),
      slug,
      description: `Trending offer on ${storeRecord.name}. Earn guaranteed cash scratch card on order confirmation.`,
      originalPrice,
      discountedPrice: price,
      discountPercent,
      imageUrl: meta.imageUrl,
      targetUrl: url,
      cashbackEstimate: "Flat ₹15 Cashback",
      category: category || "Electronics",
      isFeatured: true,
      isActive: true,
      clicksCount: 0,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Deal added successfully from ${storeRecord.name}!`,
      deal: {
        id: dealId,
        title: customTitle || meta.title,
        price,
        store: storeRecord.name,
      },
    });
  } catch (err) {
    console.error("Error quick-adding deal:", err);
    return NextResponse.json({ error: "Failed to add deal" }, { status: 500 });
  }
}
