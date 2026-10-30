"use client";

import React, { useState } from "react";
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
  Loader2,
} from "lucide-react";
import { ScratchCardModal } from "@/components/scratch-card-modal";
import { toast } from "sonner";
import Link from "next/link";

interface WalletViewProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  confirmedBalance: number;
  pendingCashback: number;
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

export function WalletView({
  user,
  confirmedBalance: initialConfirmed,
  pendingCashback,
  scratchCards: initialCards,
  orders,
  payouts: initialPayouts,
}: WalletViewProps) {
  const [confirmedBalance, setConfirmedBalance] = useState(initialConfirmed);
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

  const unrevealedCards = scratchCards.filter((c) => !c.isRevealed);

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
        // Add pending payout locally
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
    if (activeScratchCard) {
      setScratchCards((prev) =>
        prev.map((c) =>
          c.id === activeScratchCard.id ? { ...c, isRevealed: true } : c
        )
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">My Earnings</h1>
          <p className="text-xs text-muted-foreground">
            Welcome back, {user.name || user.email?.split("@")[0]}
          </p>
        </div>
        <Link
          href="/#convert"
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          + Earn More
        </Link>
      </div>

      {/* Main Balance Card */}
      <div className="rounded-3xl p-6 bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white shadow-xl shadow-emerald-700/20 relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-200">
              Confirmed Balance
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-sm text-white">
              UPI Ready
            </span>
          </div>

          <div>
            <span className="text-4xl font-extrabold tracking-tight">
              ₹{confirmedBalance.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/20">
            <div>
              <span className="text-[11px] text-emerald-200 block">Pending Rewards</span>
              <span className="text-base font-bold text-white flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-300" />
                ₹{pendingCashback.toFixed(2)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-emerald-200 block">Available Cards</span>
              <span className="text-base font-bold text-white flex items-center justify-end gap-1">
                <Trophy className="h-3.5 w-3.5 text-yellow-300" />
                {unrevealedCards.length} Unscratched
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowWithdrawDrawer(true)}
            disabled={confirmedBalance < 50}
            className="w-full py-3 px-4 rounded-2xl font-bold bg-white text-emerald-800 hover:bg-emerald-50 transition-all shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            <ArrowUpRight className="h-4 w-4" />
            {confirmedBalance >= 50
              ? "Withdraw to UPI (Min ₹50)"
              : `Need ₹${(50 - confirmedBalance).toFixed(2)} more to Withdraw`}
          </button>
        </div>
      </div>

      {/* Unscratched Cards Section */}
      {unrevealedCards.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold">Unclaimed Scratch Cards</h3>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {unrevealedCards.length} ready
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                className="p-4 rounded-2xl border-2 border-dashed border-emerald-500/40 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/20 text-center hover:border-emerald-500 transition-all hover:scale-102 active:scale-95 group"
              >
                <div className="h-10 w-10 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:rotate-12 transition-transform">
                  <Trophy className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-foreground truncate">{card.title}</p>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">
                  Tap to Scratch!
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Orders Tracking History */}
      <div className="rounded-3xl border border-border bg-card p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-bold">Recent Shopping Orders</h3>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {orders.length} total
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-xs text-muted-foreground">No orders tracked yet.</p>
            <p className="text-[11px] text-muted-foreground">
              Paste any product link or click through a deal to start earning cashback!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{order.storeName}</span>
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
                        ? "Confirmed"
                        : order.status === "CANCELLED"
                        ? "Cancelled"
                        : "Tracked (In Review)"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Order #{order.orderNumber} • Amount: ₹{order.orderAmount}
                  </p>
                  {order.expectedConfirmationDate && order.status === "TRACKED" && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3 text-amber-500" />
                      Scratch Card: {order.expectedConfirmationDate}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                    +₹{order.userRewardAmount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout Withdrawal History */}
      {payouts.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-bold">UPI Withdrawals</h3>
          </div>

          <div className="space-y-3">
            {payouts.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-foreground">₹{p.amount.toFixed(2)}</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    UPI: {p.upiId}
                  </p>
                  {p.utrReference && (
                    <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                      UTR: {p.utrReference}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === "PAID"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : p.status === "REJECTED"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {p.status}
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
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block">
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
