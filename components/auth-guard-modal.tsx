"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, ShieldCheck, X, LogIn } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface AuthGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUrl: string;
  dealTitle?: string;
  storeName?: string;
}

export function AuthGuardModal({
  isOpen,
  onClose,
  targetUrl,
  dealTitle,
  storeName = "Store",
}: AuthGuardModalProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (!isOpen) return null;

  async function handleGoogleSignIn() {
    setIsSigningIn(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `/api/redirect?url=${encodeURIComponent(targetUrl)}`,
      });
    } catch {
      toast.error("Google sign in failed. Please try again.");
      setIsSigningIn(false);
    }
  }

  function handleContinueGuest() {
    onClose();
    // Proceed to redirect without user ID
    window.open(`/api/redirect?url=${encodeURIComponent(targetUrl)}`, "_blank");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-card border border-border p-6 shadow-2xl text-center space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Sparkles className="h-7 w-7" />
          </div>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Sign In to Claim Cashback
          </span>
          <h3 className="text-lg font-extrabold tracking-tight mt-0.5">
            Link This Purchase to Your Wallet
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Sign in so we can track your {storeName} purchase and automatically credit your guaranteed ₹1–₹20 scratch card to your UPI wallet!
          </p>
        </div>

        {dealTitle && (
          <div className="p-2.5 rounded-xl bg-muted/50 border border-border text-left">
            <p className="text-[11px] font-semibold text-foreground truncate">{dealTitle}</p>
          </div>
        )}

        <div className="space-y-2 pt-2">
          {/* 1-Tap Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full py-3 px-4 rounded-xl font-bold bg-white text-neutral-800 border border-border hover:bg-neutral-50 shadow-md flex items-center justify-center gap-2.5 transition-all active:scale-95 text-xs sm:text-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google & Track Cashback
          </button>

          {/* Email Login Alternative */}
          <Link
            href={`/sign-in?callbackUrl=${encodeURIComponent(`/api/redirect?url=${encodeURIComponent(targetUrl)}`)}`}
            className="w-full py-2.5 px-4 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-2 text-xs transition-colors"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign in with Email
          </Link>

          {/* Skip option */}
          <button
            onClick={handleContinueGuest}
            className="text-[11px] text-muted-foreground hover:text-foreground underline pt-1 block mx-auto"
          >
            Continue to {storeName} as Guest (No Cashback)
          </button>
        </div>
      </div>
    </div>
  );
}
