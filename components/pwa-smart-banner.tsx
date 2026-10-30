"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Smartphone, ArrowRight, Sparkles } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISSAL_KEY = "cashdeals_pwa_smart_banner_dismissed_until";
const COOLDOWN_DAYS = 14;

interface PwaSmartBannerProps {
  delayMs?: number;
}

const emptySubscribe = () => () => {};

export function PwaSmartBanner({ delayMs = 4000 }: PwaSmartBannerProps) {
  const pathname = usePathname();
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. If running in standalone mode (already installed), never show banner
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    // 2. If on the dedicated /app page, never show banner
    if (pathname === "/app") return;

    // 3. Check cooldown
    try {
      const dismissedUntil = localStorage.getItem(DISMISSAL_KEY);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        return;
      }
    } catch {
      // Storage access blocked in incognito
    }

    let triggered = false;
    function triggerBanner() {
      if (triggered) return;
      triggered = true;
      setShowBanner(true);
    }

    const timer = setTimeout(triggerBanner, delayMs);

    function handleScroll() {
      if (window.scrollY > 150) {
        triggerBanner();
        window.removeEventListener("scroll", handleScroll);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [delayMs, pathname]);

  if (!isClient || !showBanner) return null;

  async function handleInstallClick() {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setShowBanner(false);
        }
      } catch {
        // Fallback to /app page
      }
    }
  }

  function handleDismiss() {
    setShowBanner(false);
    try {
      const expiry = Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISSAL_KEY, String(expiry));
    } catch {
      // Ignore
    }
  }

  return (
    <aside
      aria-label="Install CashDeals App"
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg animate-in slide-in-from-top-4 duration-300"
    >
      <div className="max-w-4xl mx-auto px-3 py-2 flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold truncate text-white leading-tight">
              CashDeals Mobile App
            </p>
            <p className="text-[11px] text-white/80 truncate hidden xs:block">
              1-Tap install for faster rewards & notifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {deferredPrompt ? (
            <button
              onClick={handleInstallClick}
              className="py-1 px-3 rounded-lg bg-white text-emerald-700 font-bold text-xs hover:bg-emerald-50 transition-colors shadow-sm active:scale-95"
            >
              Install App
            </button>
          ) : (
            <Link
              href="/app"
              className="py-1 px-3 rounded-lg bg-white text-emerald-700 font-bold text-xs hover:bg-emerald-50 transition-colors shadow-sm flex items-center gap-1 active:scale-95"
            >
              Get App
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}

          <button
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
