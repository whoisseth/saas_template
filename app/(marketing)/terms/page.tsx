import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, Wallet, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | CashDeals",
  description: "Terms of service, cashback eligibility, withdrawal requirements, and referral anti-abuse policy for CashDeals.in.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-border pb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FileText className="h-5 w-5" />
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Terms of Service
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Last updated: October 2026 • Simple, practical rules for earning and withdrawing rewards.
        </p>
      </div>

      {/* Content Blocks */}
      <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-foreground/90">
        <section className="p-5 rounded-2xl border border-border bg-card space-y-2">
          <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 1. Cashback Eligibility
          </h2>
          <p className="text-muted-foreground leading-relaxed text-xs">
            To earn cashback and unlock scratch cards, you must start your shopping session by clicking our link on CashDeals.in and completing your purchase on the merchant (Flipkart, Amazon, Myntra, etc.) within the same browser session.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
            <li>Cashback is only valid on non-cancelled, non-returned legitimate orders.</li>
            <li>Orders using third-party coupon extensions or conflicting affiliate links will not be attributed.</li>
          </ul>
        </section>

        <section className="p-5 rounded-2xl border border-border bg-card space-y-2">
          <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
            <Wallet className="h-4 w-4 text-teal-500" /> 2. Return Window & Scratch Cards
          </h2>
          <p className="text-muted-foreground leading-relaxed text-xs">
            Orders appear as <strong>TRACKED</strong> within 24 to 48 hours. Because merchants offer a 7 to 15 day return/replacement policy, scratch cards automatically unlock once the merchant confirms the order is final. Unlocked cards award a guaranteed random cash reward between ₹1 and ₹20.
          </p>
        </section>

        <section className="p-5 rounded-2xl border border-border bg-card space-y-2">
          <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-500" /> 3. Referral Program & Anti-Abuse Rules
          </h2>
          <p className="text-muted-foreground leading-relaxed text-xs">
            We offer rewards for referring real friends and family. To maintain platform integrity and prevent fraud, the following strict rules apply:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li><strong>Verified Order Requirement:</strong> Referral bonuses are unlocked strictly <em>AFTER</em> the referred user completes their first legitimate order on Flipkart or Amazon and the return window passes. Signing up dummy accounts awards ₹0.</li>
            <li><strong>No Self-Referrals:</strong> You may not refer yourself, alternate email addresses belonging to you, or create multiple accounts on the same mobile device or home IP address.</li>
            <li><strong>One Account Per Human:</strong> Every user is permitted exactly one active account. Duplicate accounts or automated bot signups will result in immediate termination and forfeiture of all pending wallet balances.</li>
          </ul>
        </section>

        <section className="p-5 rounded-2xl border border-border bg-card space-y-2">
          <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> 4. UPI Withdrawals & Payouts
          </h2>
          <p className="text-muted-foreground leading-relaxed text-xs">
            The minimum confirmed wallet balance required to request a payout is <strong>₹50</strong>. You must provide a valid UPI Virtual Payment Address (e.g., yourname@paytm, yourname@okhdfcbank). CashDeals transfers funds directly to your bank account within 24–48 business hours with a 12-digit UTR reference code.
          </p>
        </section>
      </div>
    </div>
  );
}
