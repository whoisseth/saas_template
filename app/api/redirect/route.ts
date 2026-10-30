import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clicks, deals } from "@/db/schema";
import { generateSubId, buildAffiliateUrl } from "@/lib/affiliate";
import { getSession } from "@/lib/session";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let targetUrl = searchParams.get("url");
  const dealId = searchParams.get("dealId");
  const storeId = searchParams.get("storeId");

  const d = db();

  // Edge case: if URL is not provided in query param but dealId is present, lookup the deal's targetUrl
  if (!targetUrl && dealId) {
    try {
      const dealRecord = await d.query.deals.findFirst({
        where: eq(deals.id, dealId),
      });
      if (dealRecord?.targetUrl) {
        targetUrl = dealRecord.targetUrl;
      }
    } catch (err) {
      console.error("Error looking up deal for redirect:", err);
    }
  }

  if (!targetUrl || !targetUrl.startsWith("http")) {
    return NextResponse.redirect(new URL("/", req.url));
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
  const affiliateUrl = buildAffiliateUrl(targetUrl, subId);

  try {
    const d = db();
    await d.insert(clicks).values({
      id: crypto.randomUUID(),
      subId,
      userId,
      storeId: storeId || null,
      dealId: dealId || null,
      originalUrl: targetUrl,
      affiliateUrl,
      ipAddress: req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for"),
      userAgent: req.headers.get("user-agent"),
      createdAt: new Date(),
    });

    if (dealId) {
      await d.update(deals).set({
        clicksCount: sql`${deals.clicksCount} + 1`,
      }).where(eq(deals.id, dealId));
    }
  } catch (err) {
    console.error("Error logging click:", err);
  }

  return NextResponse.redirect(affiliateUrl, 302);
}
