import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Eye, Database, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | CashDeals",
  description: "Learn how CashDeals protects your privacy, personal information, and affiliate tracking data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
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
            <ShieldCheck className="h-5 w-5" />
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Privacy Policy
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Last updated: October 2026 • Simple, transparent, and user-first.
        </p>
      </div>

      {/* Content Blocks */}
      <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-foreground/90">
        <section className="p-5 rounded-2xl border border-border bg-card space-y-2">
          <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-500" /> 1. Information We Collect
          </h2>
          <p className="text-muted-foreground leading-relaxed text-xs">
            We only collect the absolute minimum data required to deliver your cashback:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
            <li><strong>Account Details:</strong> Your name and email address when you sign in via Google OAuth or email to link your wallet.</li>
            <li><strong>UPI ID (VPA):</strong> Stored strictly for executing your ₹50+ bank withdrawal payouts via PhonePe or Google Pay.</li>
            <li><strong>Tracking SubIDs:</strong> A randomized 24-character alphanumeric session token generated when you click a deal, used solely to match your order from merchant affiliate reports.</li>
          </ul>
        </section>

        <section className="p-5 rounded-2xl border border-border bg-card space-y-2">
          <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
            <Eye className="h-4 w-4 text-teal-500" /> 2. What We NEVER Collect
          </h2>
          <p className="text-muted-foreground leading-relaxed text-xs">
            We operate under strict financial boundaries:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
            <li>We <strong>NEVER</strong> ask for or store credit/debit card details, bank account PINs, or OTPs.</li>
            <li>All shopping and payment transactions happen directly on the official merchant websites (Flipkart, Amazon, Myntra).</li>
            <li>We never sell, rent, or trade your personal contact details to third-party telemarketers.</li>
          </ul>
        </section>

        <section className="p-5 rounded-2xl border border-border bg-card space-y-2">
          <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
            <Database className="h-4 w-4 text-cyan-500" /> 3. Affiliate Tracking & Cookies
          </h2>
          <p className="text-muted-foreground leading-relaxed text-xs">
            When you tap &quot;Shop on Merchant&quot;, our redirect engine attaches your anonymous SubID to the merchant link. When you finalize an order, the merchant records our affiliate commission and notifies our reconciler to credit your scratch card. We do not use intrusive tracking cookies across external websites.
          </p>
        </section>

        <section className="p-5 rounded-2xl border border-border bg-card space-y-2">
          <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-amber-500" /> 4. Data Deletion
          </h2>
          <p className="text-muted-foreground leading-relaxed text-xs">
            You may request complete deletion of your account and ledger history at any time by contacting us or initiating an account export from your dashboard.
          </p>
        </section>
      </div>
    </div>
  );
}
