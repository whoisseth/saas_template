"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import {
  Smartphone,
  Download,
  Share2,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Zap,
  QrCode,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface AppDownloadLandingViewProps {
  initialQrCode?: string;
  appUrl?: string;
}

const emptySubscribe = () => () => {};

export function AppDownloadLandingView({
  initialQrCode,
  appUrl = "https://cashdeals.in/app",
}: AppDownloadLandingViewProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua));
    setIsAndroid(/android/.test(ua));

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
          toast.success("CashDeals App successfully installed!");
        }
      } catch (err) {
        console.error(err);
      }
    } else if (isIos) {
      toast.info("On iPhone: Tap Share (square with arrow) and select 'Add to Home Screen'");
    } else {
      toast.info("Tap the 3 dots in Chrome and select 'Install app' or 'Add to Home screen'");
    }
  }

  async function handleShare() {
    const shareData = {
      title: "CashDeals - Earn Guaranteed Cashback on Flipkart & Amazon",
      text: "Shop on Flipkart, Amazon & Myntra and get guaranteed cash rewards directly to your UPI! Install the app:",
      url: appUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Dismissed
      }
    } else {
      handleCopyLink();
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    toast.success("App link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5" />
          Official CashDeals Web App
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Install the CashDeals Mobile App
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
          Fast, ultra-lightweight (0 MB storage), and no Play Store download required. Get instant notifications and scratch cards.
        </p>
      </div>

      {/* Main Action Card */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* QR Code (Visible on Desktop) */}
          {initialQrCode && (
            <div className="flex-shrink-0 text-center p-3 rounded-2xl bg-white border border-border shadow-sm hidden sm:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={initialQrCode}
                alt="Scan to Install CashDeals"
                className="h-36 w-36 mx-auto rounded-lg"
              />
              <span className="text-[11px] font-semibold text-neutral-600 mt-2 block">
                Scan with phone camera
              </span>
            </div>
          )}

          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                1-Tap Quick Install
              </span>
              <h2 className="text-xl font-bold mt-0.5">
                {isInstalled ? "App Already Installed" : "Add to Your Phone Screen"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Works on all Android & iPhone devices directly through your mobile browser.
              </p>
            </div>

            {/* Install Button */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleInstall}
                disabled={isInstalled}
                className="py-3 px-6 rounded-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 text-sm"
              >
                {isInstalled ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    App is Installed
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Install App on Phone
                  </>
                )}
              </button>

              <button
                onClick={handleShare}
                className="py-3 px-4 rounded-2xl font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <Share2 className="h-4 w-4" />
                Share with Friends
              </button>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 pt-6 border-t border-border">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40">
            <Zap className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div className="text-left">
              <h4 className="text-xs font-bold">Zero Phone Storage</h4>
              <p className="text-[11px] text-muted-foreground">Runs natively via browser</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40">
            <Sparkles className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <div className="text-left">
              <h4 className="text-xs font-bold">Instant Scratch Cards</h4>
              <p className="text-[11px] text-muted-foreground">₹1-₹20 on every order</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40">
            <ShieldCheck className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <div className="text-left">
              <h4 className="text-xs font-bold">Fast UPI Payouts</h4>
              <p className="text-[11px] text-muted-foreground">Directly to GPay / PhonePe</p>
            </div>
          </div>
        </div>

        {/* Platform Instructions Guide */}
        <div className="mt-6 pt-6 border-t border-border space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            How to Install Manually:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
              <span className="font-bold flex items-center gap-1.5 text-foreground">
                <Smartphone className="h-4 w-4 text-emerald-600" />
                Android (Chrome):
              </span>
              <p className="text-muted-foreground leading-relaxed">
                1. Tap the <strong>three dots (⋮)</strong> at the top right of Chrome.<br />
                2. Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.<br />
                3. The CashDeals icon will appear on your phone apps list.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
              <span className="font-bold flex items-center gap-1.5 text-foreground">
                <Smartphone className="h-4 w-4 text-blue-600" />
                iPhone (Safari):
              </span>
              <p className="text-muted-foreground leading-relaxed">
                1. Open CashDeals in Safari browser.<br />
                2. Tap the <strong>Share button</strong> (square with up arrow).<br />
                3. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
