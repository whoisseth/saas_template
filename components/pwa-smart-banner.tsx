"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Smartphone, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISSAL_KEY = "cashdeals_pwa_dismissed_v2";
const COOLDOWN_DAYS = 30;

const emptySubscribe = () => () => {};

export function PwaSmartBanner() {
  const pathname = usePathname();
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Do not show on desktop, only mobile/tablet
    const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());
    if (!isMobile) return;

    // Never show if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // Never show on the dedicated /app page
    if (pathname === "/app") return;

    // Check dismissal cooldown
    try {
      const dismissedUntil = localStorage.getItem(DISMISSAL_KEY);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        return;
      }
    } catch {
      // Storage blocked
    }

    // Gentle delay after user scrolls or interacts (non-intrusive)
    function onScroll() {
      if (window.scrollY > 250) {
        setShowPrompt(true);
        window.removeEventListener("scroll", onScroll);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [pathname]);

  if (!isClient || !showPrompt) return null;

  async function handleInstall() {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setShowPrompt(false);
        }
      } catch {
        // Fallback
      }
    }
  }

  function handleDismiss() {
    setShowPrompt(false);
    try {
      const expiry = Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISSAL_KEY, String(expiry));
    } catch {
      // Ignore
    }
  }

  return (
    <div
      aria-label="Install App Prompt"
      className="fixed bottom-20 left-4 right-4 z-40 max-w-sm mx-auto sm:hidden animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      <div className="rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl p-3 shadow-2xl flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-600/20">
            <Smartphone className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-foreground truncate">Install CashDeals App</p>
            <p className="text-[10px] text-muted-foreground truncate">
              0 MB space • Instant scratch cards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {deferredPrompt ? (
            <button
              onClick={handleInstall}
              className="py-1.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm active:scale-95 flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              Install
            </button>
          ) : (
            <Link
              href="/app"
              className="py-1.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm active:scale-95"
            >
              Get App
            </Link>
          )}

          <button
            onClick={handleDismiss}
            aria-label="Close"
            className="p-1 rounded-full text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
