"use client";

import React, { useState, useEffect } from "react";
import {
  FileUp,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  Wallet,
  Users,
  ShoppingBag,
  ExternalLink,
  PlusCircle,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface AdminViewProps {
  metrics: {
    ordersCount: number;
    ordersVolume: number;
    totalCommission: number;
    pendingPayoutsCount: number;
    pendingPayoutsAmount: number;
    totalUsers: number;
  };
}

interface PayoutItem {
  id: string;
  userId: string;
  amount: number;
  upiId: string;
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
  utrReference?: string | null;
  requestedAt: string;
  userName?: string | null;
  userEmail?: string | null;
  qrCodeDataUrl?: string | null;
}

export function AdminView({ metrics }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<"reconcile" | "payouts" | "deals">("payouts");

  // Reconcile state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<{
    matched: number;
    scratchCardsIssued: number;
    message: string;
  } | null>(null);

  // Payouts state
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [isLoadingPayouts, setIsLoadingPayouts] = useState(false);
  const [utrInputs, setUtrInputs] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayouts();
  }, []);

  async function fetchPayouts() {
    setIsLoadingPayouts(true);
    try {
      const res = await fetch("/api/admin/payouts");
      const data = (await res.json()) as { success?: boolean; payouts?: PayoutItem[] };
      if (data.success) {
        setPayouts(data.payouts || []);
      }
    } catch {
      toast.error("Failed to load payouts");
    } finally {
      setIsLoadingPayouts(false);
    }
  }

  async function handleReconcileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!csvFile) {
      toast.error("Please select an Earnly CSV report file");
      return;
    }

    setIsReconciling(true);
    setReconcileResult(null);

    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      const res = await fetch("/api/admin/reconcile", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as { success?: boolean; matched: number; scratchCardsIssued: number; message: string; error?: string };
      if (res.ok && data.success) {
        setReconcileResult(data);
        toast.success(data.message);
        setCsvFile(null);
      } else {
        toast.error(data.error || "Failed to process CSV report");
      }
    } catch {
      toast.error("Network error during reconciliation");
    } finally {
      setIsReconciling(false);
    }
  }

  async function handleMarkPaid(payoutId: string) {
    const utr = utrInputs[payoutId]?.trim();
    if (!utr || utr.length < 6) {
      toast.error("Please enter a valid 12-digit UPI UTR / Reference number");
      return;
    }

    setProcessingId(payoutId);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutId,
          utrReference: utr,
          action: "pay",
        }),
      });

      const data = (await res.json()) as { success?: boolean; message?: string; error?: string };
      if (res.ok && data.success) {
        toast.success(data.message || "Payout processed");
        setPayouts((prev) =>
          prev.map((p) => (p.id === payoutId ? { ...p, status: "PAID", utrReference: utr } : p))
        );
      } else {
        toast.error(data.error || "Failed to mark paid");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setProcessingId(null);
    }
  }

  function downloadSampleCsv() {
    const sample = `SubID,OrderID,Store,OrderAmount,CommissionAmount,Status\nu_guest_a1b2c3,ORD_98412,Flipkart,1499,95,Approved\nu_guest_d4e5f6,ORD_98413,Amazon,899,45,Pending\nu_guest_x7y8z9,ORD_98414,Myntra,2499,150,Approved\n`;
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Earnly_Sample_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Platform Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            CashDeals Admin Center
          </h1>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted border border-border">
          <button
            onClick={() => setActiveTab("payouts")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "payouts"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            UPI Payouts ({metrics.pendingPayoutsCount})
          </button>
          <button
            onClick={() => setActiveTab("reconcile")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "reconcile"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Earnly CSV Reconcile
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
            <ShoppingBag className="h-3.5 w-3.5 text-blue-500" /> Total Orders
          </span>
          <p className="text-xl font-extrabold">{metrics.ordersCount}</p>
          <p className="text-[10px] text-muted-foreground">₹{metrics.ordersVolume.toLocaleString("en-IN")} GMV</p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Net Commission
          </span>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            ₹{metrics.totalCommission.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground">From Earnly Reports</p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
            <Wallet className="h-3.5 w-3.5 text-amber-500" /> Pending Payouts
          </span>
          <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
            ₹{metrics.pendingPayoutsAmount.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground">{metrics.pendingPayoutsCount} requests pending</p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-purple-500" /> Total Users
          </span>
          <p className="text-xl font-extrabold">{metrics.totalUsers}</p>
          <p className="text-[10px] text-muted-foreground">Registered accounts</p>
        </div>
      </div>

      {/* TAB 1: PENDING UPI PAYOUTS WITH DYNAMIC QR */}
      {activeTab === "payouts" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Pending UPI Withdrawals</h2>
              <p className="text-xs text-muted-foreground">
                Scan the dynamic QR code with PhonePe/GPay, transfer the money, and enter the 12-digit UTR.
              </p>
            </div>
            <button
              onClick={fetchPayouts}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors"
            >
              Refresh Queue
            </button>
          </div>

          {isLoadingPayouts ? (
            <div className="py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground space-y-1">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="font-semibold text-foreground">All caught up!</p>
              <p>No pending withdrawal requests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl border border-border bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Dynamic QR Code */}
                  {p.qrCodeDataUrl && p.status === "PENDING" && (
                    <div className="p-2 rounded-xl bg-white border border-border shadow-sm flex-shrink-0 text-center mx-auto sm:mx-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.qrCodeDataUrl}
                        alt="Scan UPI QR"
                        className="h-28 w-28 rounded"
                      />
                      <span className="text-[9px] font-bold text-neutral-600 block mt-0.5">
                        Scan with GPay/PhonePe
                      </span>
                    </div>
                  )}

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-foreground">
                        ₹{p.amount.toFixed(2)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      UPI ID: {p.upiId}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      User: {p.userName || p.userEmail || p.userId.slice(0, 8)}
                    </p>
                    {p.utrReference && (
                      <p className="text-[10px] font-mono text-muted-foreground">
                        UTR: {p.utrReference}
                      </p>
                    )}
                  </div>

                  {p.status === "PENDING" && (
                    <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="text"
                        value={utrInputs[p.id] || ""}
                        onChange={(e) =>
                          setUtrInputs((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                        placeholder="Enter 12-digit UTR..."
                        className="w-full sm:w-44 rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                      <button
                        onClick={() => handleMarkPaid(p.id)}
                        disabled={processingId === p.id}
                        className="w-full sm:w-auto py-2 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 disabled:opacity-60"
                      >
                        {processingId === p.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Mark Paid"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EARNLY CSV RECONCILIATION */}
      {activeTab === "reconcile" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Earnly CSV Report Ingestion</h2>
              <p className="text-xs text-muted-foreground">
                Drag and drop your weekly transaction CSV export from the Earnly dashboard.
              </p>
            </div>
            <button
              onClick={downloadSampleCsv}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-border hover:bg-muted text-foreground flex items-center gap-1.5 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Sample CSV
            </button>
          </div>

          <form onSubmit={handleReconcileSubmit} className="space-y-4">
            <div className="p-8 border-2 border-dashed border-border rounded-2xl text-center space-y-3 hover:border-emerald-500/50 transition-colors bg-muted/20">
              <FileUp className="h-8 w-8 text-muted-foreground mx-auto" />
              <div>
                <label className="text-xs font-bold text-foreground cursor-pointer hover:underline">
                  <span>{csvFile ? csvFile.name : "Click to select Earnly CSV file"}</span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  />
                </label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Must include SubID, OrderID, and Commission columns
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={!csvFile || isReconciling}
              className="w-full py-3.5 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-50"
            >
              {isReconciling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reconciling Orders & Issuing Scratch Cards...
                </>
              ) : (
                "Run Auto-Reconciliation"
              )}
            </button>
          </form>

          {reconcileResult && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-1 text-xs">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {reconcileResult.message}
              </p>
              <p className="text-[11px] opacity-90">
                Matched: {reconcileResult.matched} orders • Unlocked {reconcileResult.scratchCardsIssued} scratch cards
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
