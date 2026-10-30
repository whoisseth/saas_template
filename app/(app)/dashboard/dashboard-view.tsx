"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  ArrowUpRight,
  Clock,
  Sparkles,
  Trophy,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Share2,
  Copy,
  LogOut,
  Settings,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { ScratchCardModal } from "@/components/scratch-card-modal";
import { LinkConverterBox } from "@/components/link-converter-box";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface DashboardViewProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  isAdmin: boolean;
  confirmedBalance: number;
  pendingCashback: number;
  lifetimeEarned: number;
  scratchCards: Array<{
    id: string;
    rewardAmount: number;
    title: string;
    isRevealed: boolean;
    createdAt: Date;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    storeName: string;
    orderAmount: number;
    userRewardAmount: number;
    status: "TRACKED" | "CONFIRMED" | "CANCELLED";
    expectedConfirmationDate?: string | null;
    createdAt: Date;
  }>;
  payouts: Array<{
    id: string;
    amount: number;
    upiId: string;
    status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
    utrReference?: string | null;
    requestedAt: Date;
  }>;
}

export function DashboardView({
  user,
  isAdmin,
  confirmedBalance: initialConfirmed,
  pendingCashback,
  lifetimeEarned: initialLifetime,
  scratchCards: initialCards,
  orders,
  payouts: initialPayouts,
}: DashboardViewProps) {
  const router = useRouter();
  const [confirmedBalance, setConfirmedBalance] = useState(initialConfirmed);
  const [lifetimeEarned, setLifetimeEarned] = useState(initialLifetime);
  const [scratchCards, setScratchCards] = useState(initialCards);
  const [payouts, setPayouts] = useState(initialPayouts);

  const [activeScratchCard, setActiveScratchCard] = useState<{
    id: string;
    amount: number;
    title: string;
  } | null>(null);

  const [showWithdrawDrawer, setShowWithdrawDrawer] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState(
    Math.max(50, Math.floor(confirmedBalance))
  );
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);

  const unrevealedCards = scratchCards.filter((c) => !c.isRevealed);
  const referralLink = typeof window !== "undefined"
    ? `${window.location.origin}/sign-up?ref=${user.id.slice(0, 8)}`
    : `https://cashdeals.in/sign-up?ref=${user.id.slice(0, 8)}`;

  async function handleSignOut() {
    try {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to sign out");
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    if (confirmedBalance < 50) {
      toast.error("Minimum withdrawal balance is ₹50");
      return;
    }
    if (!upiId.trim() || !upiId.includes("@")) {
      toast.error("Please enter a valid UPI ID (e.g. 9876543210@paytm)");
      return;
    }

    setIsSubmittingPayout(true);
    try {
      const res = await fetch("/api/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upiId: upiId.trim(),
          amount: withdrawAmount,
        }),
      });

      const data = (await res.json()) as { success?: boolean; payoutId?: string; message?: string; error?: string };
      if (res.ok && data.success) {
        toast.success(data.message || "Withdrawal submitted");
        setConfirmedBalance((prev) => Math.max(0, prev - withdrawAmount));
        setShowWithdrawDrawer(false);
        setPayouts((prev) => [
          {
            id: data.payoutId || crypto.randomUUID(),
            amount: withdrawAmount,
            upiId: upiId.trim(),
            status: "PENDING",
            requestedAt: new Date(),
          },
          ...prev,
        ]);
      } else {
        toast.error(data.error || "Withdrawal failed");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmittingPayout(false);
    }
  }

  function onScratchClaimed(amount: number) {
    setConfirmedBalance((prev) => prev + amount);
    setLifetimeEarned((prev) => prev + amount);
    if (activeScratchCard) {
      setScratchCards((prev) =>
        prev.map((c) =>
          c.id === activeScratchCard.id ? { ...c, isRevealed: true } : c
        )
      );
    }
  }

  function copyReferral() {
    navigator.clipboard.writeText(referralLink);
    setCopiedReferral(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopiedReferral(false), 2500);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header Card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-emerald-600/20">
            {user.name ? user.name[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : "U"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">
                {user.name || user.email?.split("@")[0]}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Verified Shopper
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="py-2 px-3.5 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-colors flex items-center gap-1.5"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Admin Portal
            </Link>
          )}

          <Link
            href="/"
            className="py-2 px-3.5 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition-colors"
          >
            Browse Deals
          </Link>

          <button
            onClick={handleSignOut}
            className="py-2 px-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Confirmed Balance */}
        <div className="p-5 rounded-3xl border border-border bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-900/10 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Confirmed Balance
            </span>
            <span className="text-3xl font-extrabold text-foreground mt-1 block">
              ₹{confirmedBalance.toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => setShowWithdrawDrawer(true)}
            disabled={confirmedBalance < 50}
            className="w-full py-2 px-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            {confirmedBalance >= 50 ? "Withdraw UPI" : "Min ₹50"}
          </button>
        </div>

        {/* Pending Cashback */}
        <div className="p-5 rounded-3xl border border-border bg-card shadow-sm space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              Pending in Review
            </span>
            <span className="text-3xl font-extrabold text-foreground mt-1 block">
              ₹{pendingCashback.toFixed(2)}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-500" />
            Within return window
          </p>
        </div>

        {/* Scratch Cards */}
        <div className="p-5 rounded-3xl border border-border bg-card shadow-sm space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              Scratch Cards
            </span>
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 block">
              {unrevealedCards.length}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Trophy className="h-3 w-3 text-amber-500" />
            ₹1–₹20 guaranteed cash
          </p>
        </div>

        {/* Lifetime Earned */}
        <div className="p-5 rounded-3xl border border-border bg-card shadow-sm space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              Lifetime Earned
            </span>
            <span className="text-3xl font-extrabold text-foreground mt-1 block">
              ₹{lifetimeEarned.toFixed(2)}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            100% Free rewards
          </p>
        </div>
      </div>

      {/* Embedded Live Link Converter Tool */}
      <div className="space-y-3">
        <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-500" />
          Activate Cashback on Any Product
        </h2>
        <LinkConverterBox />
      </div>

      {/* Unscratched Cards Section */}
      {unrevealedCards.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-bold">Unclaimed Scratch Cards</h3>
            </div>
            <span className="text-xs text-muted-foreground font-semibold">
              {unrevealedCards.length} cards available
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {unrevealedCards.map((card) => (
              <button
                key={card.id}
                onClick={() =>
                  setActiveScratchCard({
                    id: card.id,
                    amount: card.rewardAmount,
                    title: card.title,
                  })
                }
                className="p-4 rounded-2xl border-2 border-dashed border-emerald-500/50 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/20 text-center hover:border-emerald-500 transition-all hover:scale-102 active:scale-95 group shadow-sm"
              >
                <div className="h-10 w-10 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:rotate-12 transition-transform">
                  <Trophy className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-foreground truncate">{card.title}</p>
                <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
                  Tap to Scratch!
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Orders Tracking History */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-emerald-500" />
            <h3 className="text-base font-bold">My Shopping Orders</h3>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {orders.length} orders tracked
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <ShoppingBag className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
            <p className="text-xs font-semibold text-foreground">No orders tracked yet</p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Use the search bar above to paste any Flipkart or Amazon link before buying, and your order will show up here!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-muted/30 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">{order.storeName}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === "CONFIRMED"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : order.status === "CANCELLED"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {order.status === "CONFIRMED"
                        ? "Confirmed & Paid"
                        : order.status === "CANCELLED"
                        ? "Cancelled"
                        : "Tracked (In Return Window)"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Order Ref: #{order.orderNumber} • Amount: ₹{order.orderAmount}
                  </p>
                  {order.expectedConfirmationDate && order.status === "TRACKED" && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3 text-amber-500" />
                      Scratch Card: {order.expectedConfirmationDate}
                    </p>
                  )}
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-muted-foreground block">Cashback</span>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 block">
                    +₹{order.userRewardAmount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refer & Earn Banner */}
      <div className="rounded-3xl border border-border bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-cyan-500/10 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold">Refer Friends & Earn ₹10 Bonus</h3>
          </div>
          <p className="text-xs text-muted-foreground max-w-md">
            Share your personal referral link. Whenever a friend makes their first confirmed purchase, you both unlock bonus scratch cards!
          </p>
        </div>

        <button
          onClick={copyReferral}
          className="py-2.5 px-4 rounded-xl text-xs font-bold bg-card border border-border hover:bg-muted text-foreground flex items-center gap-2 shadow-sm transition-all active:scale-95 flex-shrink-0"
        >
          <Copy className="h-3.5 w-3.5" />
          {copiedReferral ? "Copied!" : "Copy Referral Link"}
        </button>
      </div>

      {/* Payout Withdrawal History */}
      {payouts.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-500" />
            <h3 className="text-base font-bold">UPI Withdrawal History</h3>
          </div>

          <div className="space-y-3">
            {payouts.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl bg-muted/30 border border-border flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-extrabold text-foreground text-sm">₹{p.amount.toFixed(2)}</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    UPI ID: {p.upiId}
                  </p>
                  {p.utrReference && (
                    <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Bank Ref (UTR): {p.utrReference}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      p.status === "PAID"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : p.status === "REJECTED"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {p.status === "PAID" ? "Completed (Paid)" : p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Withdraw Modal Drawer */}
      {showWithdrawDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Withdraw to UPI</h3>
              <button
                onClick={() => setShowWithdrawDrawer(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Enter Your UPI ID (VPA)
                </label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. 9876543210@paytm or name@okaxis"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Supports Google Pay, PhonePe, Paytm, BHIM & all Indian banks.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Withdrawal Amount (₹)
                </label>
                <input
                  type="number"
                  min={50}
                  max={Math.floor(confirmedBalance)}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block font-semibold">
                  Available: ₹{confirmedBalance.toFixed(2)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>
                  Please double-check your UPI ID. Payouts sent to an incorrect UPI ID cannot be reversed.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmittingPayout}
                className="w-full py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 text-xs sm:text-sm"
              >
                {isSubmittingPayout ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Confirm Withdrawal
                    <ArrowUpRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Active Scratch Card Modal */}
      {activeScratchCard && (
        <ScratchCardModal
          cardId={activeScratchCard.id}
          title={activeScratchCard.title}
          expectedAmount={activeScratchCard.amount}
          onClaimed={onScratchClaimed}
          onClose={() => setActiveScratchCard(null)}
        />
      )}
    </div>
  );
}
