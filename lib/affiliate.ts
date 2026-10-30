import crypto from "crypto";

// Earnly & Affiliate Partner Settings
const EARNLY_PUBLISHER_ID = process.env.EARNLY_PUBLISHER_ID || "c7zko6s5mfo";
const AMAZON_TAG = process.env.AMAZON_ASSOCIATE_TAG || "cashdeals-21";
const FLIPKART_AFFID = process.env.FLIPKART_AFFID || "admingopai";

/**
 * Generate a compact, alphanumeric SubID guaranteed <= 24 chars to avoid affiliate network truncation
 * Format: u_{userIdPrefix}_{randomSuffix}
 */
export function generateSubId(userId?: string | null): string {
  const userPrefix = userId ? userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) : "guest";
  const randomSuffix = crypto.randomBytes(3).toString("hex"); // 6 chars
  return `u_${userPrefix}_${randomSuffix}`.slice(0, 24);
}

/**
 * Build tracked direct affiliate link with SubID.
 * Redirects DIRECTLY to Amazon, Flipkart, Myntra, or Ajio with correct tracking parameters,
 * eliminating broken intermediate redirect pages.
 */
export function buildAffiliateUrl(originalUrl: string, subId: string): string {
  try {
    const urlObj = new URL(originalUrl);

    // 1. AMAZON Direct Affiliate Tracking
    if (urlObj.hostname.includes("amazon.in") || urlObj.hostname.includes("amzn.to") || urlObj.hostname.includes("amazon.com")) {
      urlObj.searchParams.set("tag", AMAZON_TAG);
      urlObj.searchParams.set("ascsubtag", subId);
      return urlObj.toString();
    }

    // 2. FLIPKART Direct Affiliate Tracking
    if (urlObj.hostname.includes("flipkart.com")) {
      urlObj.searchParams.set("affid", FLIPKART_AFFID);
      urlObj.searchParams.set("affExtParam1", subId);
      urlObj.searchParams.set("affExtParam2", EARNLY_PUBLISHER_ID);
      return urlObj.toString();
    }

    // 3. MYNTRA Direct Affiliate Tracking
    if (urlObj.hostname.includes("myntra.com")) {
      urlObj.searchParams.set("affExtParam1", subId);
      return urlObj.toString();
    }

    // 4. AJIO Direct Affiliate Tracking
    if (urlObj.hostname.includes("ajio.com")) {
      urlObj.searchParams.set("subid", subId);
      return urlObj.toString();
    }

    // Fallback: attach subId directly
    urlObj.searchParams.set("subid", subId);
    return urlObj.toString();
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
 * Decode HTML entities and clean marketplace title suffixes
 */
export function cleanProductTitle(raw: string): string {
  let title = raw
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#40;/g, "(")
    .replace(/&#41;/g, ")");

  // Clean common e-commerce marketplace boilerplate suffixes
  title = title.replace(/^Buy\s+/i, "");
  title = title.replace(/\s+at\s+Amazon\.in.*$/i, "");
  title = title.replace(/\s*:\s*Amazon\.in.*$/i, "");
  title = title.replace(/\s*\|\s*Flipkart\.com.*$/i, "");
  title = title.replace(/\s*-\s*Buy\s+Online\s+at\s+Best\s+Price\s+in\s+India.*$/i, "");
  title = title.replace(/\s*-\s*Flipkart.*$/i, "");

  return title.trim().slice(0, 120);
}

/**
 * Extract direct Amazon product ASIN from URL
 */
export function extractAmazonAsin(url: string): string | null {
  const match = url.match(/(?:\/dp\/|\/gp\/product\/|\/product\/|\/d\/|\/ASIN\/)([A-Z0-9]{10})/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Auto-extract high-accuracy product metadata from Flipkart/Amazon/Myntra links
 */
export async function fetchProductMetadata(url: string): Promise<{
  title: string;
  imageUrl: string;
  price?: number;
  store: "Flipkart" | "Amazon" | "Myntra" | "Ajio" | "Other";
}> {
  let store: "Flipkart" | "Amazon" | "Myntra" | "Ajio" | "Other" = "Other";
  if (url.includes("flipkart.com")) store = "Flipkart";
  else if (url.includes("amazon.in") || url.includes("amzn.to") || url.includes("amazon.com")) store = "Amazon";
  else if (url.includes("myntra.com")) store = "Myntra";
  else if (url.includes("ajio.com")) store = "Ajio";

  // Check for direct Amazon ASIN image (Deterministic, 100% reliable)
  const amazonAsin = store === "Amazon" ? extractAmazonAsin(url) : null;
  const directAmazonImage = amazonAsin
    ? `https://images-na.ssl-images-amazon.com/images/P/${amazonAsin}.01.MAIN._SCRMZZZZZZ_.jpg`
    : null;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return {
        title: store === "Amazon" && amazonAsin ? `Amazon Product (ASIN: ${amazonAsin})` : `${store} Special Deal`,
        imageUrl: directAmazonImage || fallbackStoreImage(store),
        store,
      };
    }

    const html = await res.text();

    // Extract OpenGraph Title
    const titleMatch =
      html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
      html.match(/<title>(.*?)<\/title>/i) ||
      html.match(/<h1[^>]*id=["']productTitle["'][^>]*>([\s\S]*?)<\/h1>/i);

    const rawTitle = titleMatch ? titleMatch[1].trim() : `${store} Special Deal`;
    const title = cleanProductTitle(rawTitle);

    // Extract Image:
    // If Amazon and ASIN is available, use direct CloudFront ASIN image
    let imageUrl = directAmazonImage;

    if (!imageUrl) {
      const ogImageMatch =
        html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
        html.match(/<meta\s+name=["']twitter:image["']\s+content=["'](.*?)["']/i) ||
        html.match(/id=["']landingImage["'][^>]*src=["'](.*?)["']/i) ||
        html.match(/data-old-hires=["'](.*?)["']/i);

      if (ogImageMatch && ogImageMatch[1].startsWith("http")) {
        imageUrl = ogImageMatch[1];
      }
    }

    if (!imageUrl) {
      imageUrl = fallbackStoreImage(store);
    }

    // Extract Approximate Price if available in meta tags
    const priceMatch =
      html.match(/<meta\s+property=["']product:price:amount["']\s+content=["']([\d.]+)["']/i) ||
      html.match(/class=["']a-price-whole["']>([\d,]+)/i) ||
      html.match(/["']price["']\s*:\s*["']?([\d,]+)["']?/i);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, "")) : undefined;

    return {
      title,
      imageUrl,
      price,
      store,
    };
  } catch {
    return {
      title: store === "Amazon" && amazonAsin ? `Amazon Product (ASIN: ${amazonAsin})` : `${store} Special Deal`,
      imageUrl: directAmazonImage || fallbackStoreImage(store),
      store,
    };
  }
}

function fallbackStoreImage(store: "Flipkart" | "Amazon" | "Myntra" | "Ajio" | "Other"): string {
  switch (store) {
    case "Flipkart":
      return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";
    case "Amazon":
      return "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80";
    case "Myntra":
      return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80";
    case "Ajio":
      return "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80";
    default:
      return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80";
  }
}
