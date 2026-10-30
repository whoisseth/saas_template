import crypto from "crypto";

// Earnly publisher settings (Fallback to configurable env vars)
const EARNLY_PUBLISHER_ID = process.env.EARNLY_PUBLISHER_ID || "earnly_demo_partner";
const EARNLY_BASE_REDIRECT = process.env.EARNLY_REDIRECT_URL || "https://earnly.in/deal";

/**
 * Generate a compact, alphanumeric SubID guaranteed <= 24 chars to avoid truncation
 * Format: u{userIdOr0}_c{random6chars}
 */
export function generateSubId(userId?: string | null): string {
  const userPrefix = userId ? userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) : "guest";
  const randomSuffix = crypto.randomBytes(3).toString("hex"); // 6 chars
  return `u_${userPrefix}_${randomSuffix}`.slice(0, 24);
}

/**
 * Build tracked affiliate link with SubID and Earnly publisher parameter
 */
export function buildAffiliateUrl(originalUrl: string, subId: string): string {
  try {
    const encodedTarget = encodeURIComponent(originalUrl);
    // Standard affiliate redirect format
    return `${EARNLY_BASE_REDIRECT}?pid=${EARNLY_PUBLISHER_ID}&subid=${subId}&url=${encodedTarget}`;
  } catch {
    return originalUrl;
  }
}

/**
 * Calculate user reward from merchant commission with strict 70% profit margin safeguard
 * User receives min(Random(₹1-₹20), 30% of platform commission)
 */
export function calculateReward(commissionAmount: number): number {
  if (commissionAmount <= 0) return 0;
  
  const maxAllowableReward = Math.max(1, Math.floor(commissionAmount * 0.3));
  // Random reward between 1 and 20, capped by our safety margin
  const randomBase = Math.floor(Math.random() * 20) + 1;
  return Math.min(randomBase, maxAllowableReward);
}

/**
 * Auto-extract OpenGraph metadata from Flipkart/Amazon product links
 */
export async function fetchProductMetadata(url: string): Promise<{
  title: string;
  imageUrl: string;
  price?: number;
  store: "Flipkart" | "Amazon" | "Myntra" | "Other";
}> {
  let store: "Flipkart" | "Amazon" | "Myntra" | "Other" = "Other";
  if (url.includes("flipkart.com")) store = "Flipkart";
  else if (url.includes("amazon.in") || url.includes("amzn.to")) store = "Amazon";
  else if (url.includes("myntra.com")) store = "Myntra";

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return fallbackMetadata(url, store);
    }

    const html = await res.text();

    // Extract OpenGraph Title
    const titleMatch =
      html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
      html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : `${store} Special Deal`;

    // Extract OpenGraph Image
    const imageMatch =
      html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
      html.match(/<meta\s+name=["']twitter:image["']\s+content=["'](.*?)["']/i);
    const imageUrl = imageMatch
      ? imageMatch[1]
      : store === "Flipkart"
      ? "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop"
      : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop";

    // Extract Approximate Price if available in meta tags
    const priceMatch =
      html.match(/<meta\s+property=["']product:price:amount["']\s+content=["']([\d.]+)["']/i) ||
      html.match(/["']price["']\s*:\s*["']?([\d,]+)["']?/i);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, "")) : undefined;

    return {
      title: title.slice(0, 100),
      imageUrl,
      price,
      store,
    };
  } catch {
    return fallbackMetadata(url, store);
  }
}

function fallbackMetadata(url: string, store: "Flipkart" | "Amazon" | "Myntra" | "Other") {
  return {
    title: `${store} Trending Deal`,
    imageUrl:
      store === "Flipkart"
        ? "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop"
        : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop",
    store,
  };
}
