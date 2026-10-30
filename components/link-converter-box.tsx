"use client";

import React, { useState } from "react";
import { Link2, ArrowRight, Sparkles, Loader2, Clipboard, ExternalLink, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ConvertedResult {
  title: string;
  imageUrl: string;
  price?: number;
  store: string;
  subId: string;
  affiliateUrl: string;
}

export function LinkConverterBox() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ConvertedResult | null>(null);

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
      toast.error("Please paste a Flipkart or Amazon product link");
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
        toast.success("Cashback tracking activated for this product!");
      } else {
        toast.error(data.error || "Failed to convert link. Please verify URL.");
      }
    } catch {
      toast.error("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
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
                placeholder="Paste Flipkart, Amazon, or Myntra link..."
                className="w-full rounded-2xl border border-border bg-background/80 pl-10 pr-24 py-3.5 text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
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
                  Generating Tracked Deal...
                </>
              ) : (
                <>
                  Generate Cashback Link
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Converted Product Preview Result */}
          {result && (
            <div className="mt-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50 border border-border/80">
                <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-background flex-shrink-0 border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.imageUrl}
                    alt={result.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {result.store}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      Tracked
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold truncate text-foreground">
                    {result.title}
                  </h4>
                  {result.price && (
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      ₹{result.price.toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <a
                  href={result.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm transition-transform active:scale-95"
                >
                  <ExternalLink className="h-4 w-4" />
                  Shop on {result.store} & Earn Scratch Card
                </a>
                <p className="text-[11px] text-center text-muted-foreground mt-2">
                  Complete your order on {result.store} normally. Scratch card unlocks after return period.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
