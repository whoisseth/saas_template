"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

const KEY = "consent-v1";
const CHANGE_EVENT = "consent-change";

function readConsent(): boolean | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" ? true : v === "denied" ? false : null;
  } catch {
    return null;
  }
}

function readServerConsent(): boolean | null {
  return null;
}

function subscribeToConsent(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useConsent() {
  const consent = useSyncExternalStore(subscribeToConsent, readConsent, readServerConsent);
  function set(v: boolean) {
    try {
      localStorage.setItem(KEY, v ? "granted" : "denied");
    } catch {
      // Storage unavailable or disabled
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
  return { consent, grant: () => set(true), deny: () => set(false) };
}

export function ConsentBanner() {
  const { consent, grant, deny } = useConsent();

  if (consent !== null) return null;

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
          onClick={deny}
          aria-label="Dismiss cookie notice"
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
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
                onClick={grant}
                className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Accept All
              </button>
              <button
                type="button"
                onClick={deny}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
