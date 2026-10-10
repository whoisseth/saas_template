"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

const KEY = "consent-v1";
const CHANGE_EVENT = "consent-change";

function subscribeStorage(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getStoredConsent(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(KEY);
    if (v === "granted") return true;
    if (v === "denied") return false;
  } catch {
    // localStorage might be blocked or restricted
  }
  return null;
}

function getServerConsent(): boolean | null {
  return null;
}

const emptySubscribe = () => () => {};

function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function saveConsent(granted: boolean) {
  try {
    localStorage.setItem(KEY, granted ? "granted" : "denied");
  } catch {
    // ignore if storage is disabled
  }
  try {
    document.cookie = `${KEY}=${granted ? "granted" : "denied"}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // ignore
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

export function useConsent() {
  const consent = useSyncExternalStore(
    subscribeStorage,
    getStoredConsent,
    getServerConsent
  );

  return {
    consent,
    grant: () => saveConsent(true),
    deny: () => saveConsent(false),
  };
}

export function ConsentBanner() {
  const isClient = useIsClient();
  const { consent } = useConsent();

  if (!isClient || consent !== null) return null;

  const handleAcceptAll = () => {
    saveConsent(true);
  };

  const handleEssentialOnly = () => {
    saveConsent(false);
  };

  const handleDismiss = () => {
    saveConsent(false);
  };

  return (
    <div
      role="region"
      aria-label="Cookie preferences"
      className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm sm:max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="relative rounded-2xl border border-border/80 bg-background/95 p-4 shadow-2xl backdrop-blur-md transition-all">
        {/* Dismiss X button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close cookie preferences"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            {/* Cookie icon */}
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
              <path d="M8.5 8.5v.01" />
              <path d="M16 15.5v.01" />
              <path d="M12 12v.01" />
              <path d="M11 17v.01" />
              <path d="M7 14v.01" />
            </svg>
          </div>

          <div className="flex-1 pr-6">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Cookie Preferences
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              We use essential cookies to keep you signed in, and optional cookies to analyze site traffic. Learn more in our{" "}
              <Link href="/privacy" className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
                privacy policy
              </Link>.
            </p>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Accept All
              </button>
              <button
                type="button"
                onClick={handleEssentialOnly}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground transition-all hover:bg-muted active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Essential Only
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
