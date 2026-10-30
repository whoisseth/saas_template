import type { Metadata } from "next";
import QRCode from "qrcode";
import { AppDownloadLandingView } from "@/components/app-download-landing-view";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cashdeals.in";
const FULL_INSTALL_URL = `${APP_URL}/app`;

export const metadata: Metadata = {
  title: "Install Mobile App | CashDeals",
  description:
    "Get the official CashDeals mobile app. 1-tap installation with instant access to Flipkart & Amazon cashback, deals, and scratch cards.",
  alternates: {
    canonical: "/app",
  },
  openGraph: {
    title: "Install CashDeals Mobile App",
    description:
      "Instant access to verified cashback on Flipkart & Amazon shopping directly to your UPI.",
    url: "/app",
  },
};

export default async function AppDownloadPage() {
  let qrCodeDataUrl = "";
  try {
    qrCodeDataUrl = await QRCode.toDataURL(FULL_INSTALL_URL, {
      margin: 1,
      width: 240,
      color: {
        dark: "#059669",
        light: "#ffffff",
      },
    });
  } catch {
    // Graceful fallback
  }

  return (
    <main className="min-h-[85vh] flex flex-col justify-center py-6 sm:py-10">
      <AppDownloadLandingView
        initialQrCode={qrCodeDataUrl}
        appUrl={FULL_INSTALL_URL}
      />
    </main>
  );
}
