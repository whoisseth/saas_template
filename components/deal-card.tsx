"use client";

import React, { useState } from "react";
import { ExternalLink } from "lucide-react";
import { AuthGuardModal } from "./auth-guard-modal";

interface DealCardProps {
  id: string;
  title: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  imageUrl: string;
  targetUrl: string;
  cashbackEstimate?: string | null;
  category: string;
  storeName?: string | null;
  isLoggedIn: boolean;
}

export function DealCard({
  id,
  title,
  originalPrice,
  discountedPrice,
  discountPercent,
  imageUrl,
  targetUrl,
  cashbackEstimate,
  category,
  storeName = "Store",
  isLoggedIn,
}: DealCardProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  function handleShopClick(e: React.MouseEvent) {
    if (!isLoggedIn) {
      e.preventDefault();
      setShowAuthModal(true);
    }
  }

  const redirectUrl = `/api/redirect?url=${encodeURIComponent(targetUrl)}&dealId=${id}`;

  return (
    <>
      <div className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-emerald-500/40 transition-all flex flex-col group">
        <div className="relative aspect-square w-full bg-muted overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-rose-600 text-white shadow-sm">
            {discountPercent}% OFF
          </span>
          {cashbackEstimate && (
            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-600 text-white shadow-sm">
              {cashbackEstimate}
            </span>
          )}
        </div>

        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {storeName}
              </span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                {category}
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 leading-snug">
              {title}
            </h3>
          </div>

          <div className="pt-2 border-t border-border flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-extrabold text-foreground">
                ₹{discountedPrice.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-muted-foreground line-through">
                ₹{originalPrice.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <a
            href={redirectUrl}
            onClick={handleShopClick}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            Shop on {storeName}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <AuthGuardModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        targetUrl={targetUrl}
        dealTitle={title}
        storeName={storeName || "Merchant"}
      />
    </>
  );
}
