"use client";

import React, { useState } from "react";
import { Link2, ArrowRight, Sparkles, Loader2, Clipboard, ExternalLink, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthGuardModal } from "./auth-guard-modal";
import { StoreBrandBadge } from "./store-brand-badge";

interface ConvertedResult {
  store: string;
  subId: string;
  affiliateUrl: string;
  originalUrl: string;
}

export function LinkConverterBox() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ConvertedResult | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  async function handlePasteClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        toast.info("Link pasted from clipboard!");
      }
    } catch {
      toast.error("Clipboard permission denied. Please paste manually.");
    }
  }

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Please paste a Flipkart, Amazon, Myntra, or Ajio link");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/convert-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = (await res.json()) as ConvertedResult & { success?: boolean; error?: string };
      if (res.ok && data.success) {
        setResult(data);
        toast.success(`Cashback tracking activated for ${data.store}!`);
      } else {
        toast.error(data.error || "Please provide a valid Flipkart, Amazon, Myntra, or Ajio link");
      }
    } catch {
      toast.error("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const isGuest = result?.subId.startsWith("u_guest");

  function handleShopClick(e: React.MouseEvent) {
    if (isGuest && result) {
      e.preventDefault();
      setShowAuthModal(true);
    }
  }

  return (
    <div id="convert" className="w-full max-w-2xl mx-auto">
      <div className="relative rounded-3xl p-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-xl shadow-emerald-500/10">
        <div className="rounded-[22px] bg-card/95 backdrop-blur-md p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-sm sm:text-base font-bold tracking-tight">
              Paste Any Link & Unlock Instant Cashback
            </h2>
          </div>

          <form onSubmit={handleConvert} className="space-y-3">
            <div className="relative flex items-center">
              <Link2 className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste Flipkart, Amazon, Myntra, or Ajio product link..."
                className="w-full rounded-2xl border border-border bg-background/80 pl-10 pr-24 py-3.5 text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono sm:font-sans"
              />
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="absolute right-2 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-[11px] font-medium text-muted-foreground flex items-center gap-1 transition-colors"
                title="Paste from clipboard"
              >
                <Clipboard className="h-3 w-3" />
                Paste
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-5 rounded-2xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-60 text-xs sm:text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Cashback Link...
                </>
              ) : (
                <>
                  Generate Cashback Link
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Clean, Verified Result Card (No fake images) */}
          {result && (
            <div className="mt-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-muted/40 border border-emerald-500/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-24 rounded-xl bg-background border border-border p-1.5 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <StoreBrandBadge storeName={result.store} className="h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-foreground">
                        {result.store} Cashback Link Ready
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Tracked
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                      SubID: {result.subId}
                    </p>
                  </div>
                </div>

                <a
                  href={result.affiliateUrl}
                  onClick={handleShopClick}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto py-2.5 px-5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center justify-center gap-1.5 shadow-md transition-transform active:scale-95 flex-shrink-0"
                >
                  Shop on {result.store}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {isGuest && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
                  <span className="text-[11px]">
                    <strong>Tip:</strong> Sign in before completing your order so this purchase is automatically credited to your wallet & UPI ID!
                  </span>
                </div>
              )}

              <p className="text-[11px] text-center text-muted-foreground">
                Shop on {result.store} normally. When your order is confirmed, your cashback unlocks in your CashDeals dashboard.
              </p>
            </div>
          )}
        </div>
      </div>

      {result && (
        <AuthGuardModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          targetUrl={url}
          dealTitle={`${result.store} Shopping Deal`}
          storeName={result.store}
        />
      )}
    </div>
  );
}
