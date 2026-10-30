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
  MousePointerClick,
  Sparkles,
  ArrowLeft,
  Search,
  Plus,
  RefreshCw,
  X,
  Copy,
} from "lucide-react";
import Link from "next/link";
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

interface UserItem {
  id: string;
  name?: string | null;
  email: string;
  role: string;
  createdAt: string;
  image?: string | null;
  ordersCount: number;
  confirmedBalance: number;
  scratchCardsCount: number;
  lastActiveAt?: string | null;
}

interface DealItem {
  id: string;
  title: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  clicksCount: number;
  category: string;
  isActive: boolean;
  isFeatured: boolean;
  imageUrl: string;
  targetUrl: string;
  storeName?: string | null;
  storeLogo?: string | null;
}

interface ClickItem {
  id: string;
  subId: string;
  originalUrl: string;
  affiliateUrl: string;
  ipAddress?: string | null;
  createdAt: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  dealTitle?: string | null;
}

interface UserDeepDive {
  user: {
    id: string;
    name?: string | null;
    email: string;
    role: string;
    createdAt: string;
    confirmedBalance: number;
    referralCode: string;
    referralLink: string;
  };
  clicks: Array<{
    id: string;
    subId: string;
    originalUrl: string;
    affiliateUrl: string;
    ipAddress?: string | null;
    createdAt: string;
    dealTitle?: string | null;
    storeName?: string | null;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    storeName: string;
    orderAmount: number;
    userRewardAmount: number;
    status: string;
    createdAt: string;
  }>;
  scratchCards: Array<{
    id: string;
    rewardAmount: number;
    title: string;
    isRevealed: boolean;
    createdAt: string;
  }>;
  payouts: Array<{
    id: string;
    amount: number;
    upiId: string;
    status: string;
    utrReference?: string | null;
    requestedAt: string;
  }>;
}

export function AdminView({ metrics }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<"payouts" | "reconcile" | "clicks" | "users">("payouts");

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

  // Overview / Analytics state
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [dealsList, setDealsList] = useState<DealItem[]>([]);
  const [recentClicks, setRecentClicks] = useState<ClickItem[]>([]);
  const [totalClicks, setTotalClicks] = useState<number>(0);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);

  // Quick Add Deal form state
  const [newDealUrl, setNewDealUrl] = useState("");
  const [newDealCategory, setNewDealCategory] = useState("Electronics");
  const [isAddingDeal, setIsAddingDeal] = useState(false);

  // Search filter
  const [userSearch, setUserSearch] = useState("");

  // User Inspector Deep-Dive state
  const [inspectedUser, setInspectedUser] = useState<UserDeepDive | null>(null);
  const [isLoadingInspector, setIsLoadingInspector] = useState(false);

  async function handleInspectUser(userId: string) {
    setIsLoadingInspector(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const data = (await res.json()) as UserDeepDive & { success?: boolean; error?: string };
      if (res.ok && data.success) {
        setInspectedUser(data);
      } else {
        toast.error(data.error || "Failed to load user details");
      }
    } catch {
      toast.error("Failed to inspect user activity");
    } finally {
      setIsLoadingInspector(false);
    }
  }

  useEffect(() => {
    fetchPayouts();
    fetchOverview();
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

  async function fetchOverview() {
    setIsLoadingOverview(true);
    try {
      const res = await fetch("/api/admin/overview");
      const data = (await res.json()) as {
        success?: boolean;
        users?: UserItem[];
        deals?: DealItem[];
        recentClicks?: ClickItem[];
        totalClicks?: number;
      };
      if (data.success) {
        setUsersList(data.users || []);
        setDealsList(data.deals || []);
        setRecentClicks(data.recentClicks || []);
        setTotalClicks(data.totalClicks || 0);
      }
    } catch {
      console.error("Failed to load overview");
    } finally {
      setIsLoadingOverview(false);
    }
  }

  async function handleQuickAddDeal(e: React.FormEvent) {
    e.preventDefault();
    if (!newDealUrl.trim() || !newDealUrl.startsWith("http")) {
      toast.error("Please enter a valid product URL");
      return;
    }

    setIsAddingDeal(true);
    try {
      const res = await fetch("/api/admin/deals/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newDealUrl.trim(),
          category: newDealCategory,
        }),
      });

      const data = (await res.json()) as { success?: boolean; message?: string; error?: string };
      if (res.ok && data.success) {
        toast.success(data.message || "Deal added successfully!");
        setNewDealUrl("");
        fetchOverview();
      } else {
        toast.error(data.error || "Failed to add deal");
      }
    } catch {
      toast.error("Connection error while adding deal");
    } finally {
      setIsAddingDeal(false);
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
        fetchOverview();
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

  const filteredUsers = usersList.filter((u) => {
    if (!userSearch.trim()) return true;
    const term = userSearch.toLowerCase();
    return (
      u.email.toLowerCase().includes(term) ||
      (u.name && u.name.toLowerCase().includes(term)) ||
      u.id.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8">
      {/* Top Header with Back Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Store
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Platform Administration
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Live
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            CashDeals Admin Center
          </h1>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-muted border border-border">
          <button
            onClick={() => setActiveTab("payouts")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "payouts"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            UPI Payouts ({metrics.pendingPayoutsCount})
          </button>
          <button
            onClick={() => setActiveTab("clicks")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "clicks"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Clicks & Deals ({totalClicks})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "users"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Users ({usersList.length || metrics.totalUsers})
          </button>
          <button
            onClick={() => setActiveTab("reconcile")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "reconcile"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            CSV Reconcile
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
          <p className="text-xl font-extrabold">{usersList.length || metrics.totalUsers}</p>
          <p className="text-[10px] text-muted-foreground">Active accounts</p>
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

      {/* TAB 2: CLICKS & DEALS ANALYTICS */}
      {activeTab === "clicks" && (
        <div className="space-y-6">
          {/* Quick Add Deal Tool */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Plus className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-bold">Auto-Import Product Deal</h2>
                <p className="text-xs text-muted-foreground">
                  Paste any Flipkart or Amazon URL. The system automatically scrapes the title, image, price, and lists it for all users!
                </p>
              </div>
            </div>

            <form onSubmit={handleQuickAddDeal} className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                value={newDealUrl}
                onChange={(e) => setNewDealUrl(e.target.value)}
                placeholder="Paste Flipkart or Amazon product link..."
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={newDealCategory}
                onChange={(e) => setNewDealCategory(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Electronics">Electronics</option>
                <option value="Fashion">Fashion</option>
                <option value="Smartphones">Smartphones</option>
                <option value="Accessories">Accessories</option>
              </select>
              <button
                type="submit"
                disabled={isAddingDeal}
                className="py-2.5 px-5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-60 flex-shrink-0"
              >
                {isAddingDeal ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Fetching & Adding...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-3.5 w-3.5" />
                    Add Deal
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Deals Clicks Ranking Table */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4 text-emerald-500" />
                  Product Clicks & Performance
                </h2>
                <p className="text-xs text-muted-foreground">
                  Ranked by total shopper clicks and interactions.
                </p>
              </div>
              <button
                onClick={fetchOverview}
                className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-3 font-semibold">Product</th>
                    <th className="pb-3 font-semibold">Store</th>
                    <th className="pb-3 font-semibold">Price</th>
                    <th className="pb-3 font-semibold text-right">Total Clicks</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {dealsList.map((deal) => (
                    <tr key={deal.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={deal.imageUrl}
                            alt={deal.title}
                            className="h-9 w-9 rounded-lg object-cover bg-muted flex-shrink-0"
                          />
                          <span className="font-semibold text-foreground line-clamp-1 max-w-xs">
                            {deal.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {deal.storeName || "Store"}
                        </span>
                      </td>
                      <td className="py-3 font-semibold">
                        ₹{deal.discountedPrice.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 text-right">
                        <span className="font-extrabold text-foreground px-2 py-0.5 rounded bg-muted">
                          {deal.clicksCount}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <a
                          href={`/api/redirect?url=${encodeURIComponent(deal.targetUrl)}&dealId=${deal.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                        >
                          Test Link <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Live Clicks Stream */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Live Shopper Click Activity Stream
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-3 font-semibold">Time</th>
                    <th className="pb-3 font-semibold">SubID</th>
                    <th className="pb-3 font-semibold">User</th>
                    <th className="pb-3 font-semibold">Deal / Target URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recentClicks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-muted-foreground">
                        No clicks logged yet.
                      </td>
                    </tr>
                  ) : (
                    recentClicks.map((click) => (
                      <tr key={click.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 text-muted-foreground text-[11px] whitespace-nowrap">
                          {new Date(click.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-2.5 font-mono text-[11px] text-foreground font-semibold">
                          {click.subId}
                        </td>
                        <td className="py-2.5 text-[11px]">
                          {click.userName || click.userEmail ? (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {click.userName || click.userEmail}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">Guest</span>
                          )}
                        </td>
                        <td className="py-2.5 max-w-sm truncate text-[11px]">
                          {click.dealTitle || click.originalUrl}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REGISTERED USERS DIRECTORY */}
      {activeTab === "users" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Registered Users & Activity</h2>
              <p className="text-xs text-muted-foreground">
                View all signed-up accounts, total orders tracked, wallet balances, and rewards.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user by name/email..."
                className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Referral Code</th>
                  <th className="pb-3 font-semibold">Joined Date</th>
                  <th className="pb-3 font-semibold text-right">Orders</th>
                  <th className="pb-3 font-semibold text-right">Scratch Cards</th>
                  <th className="pb-3 font-semibold text-right">Confirmed Balance</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                            {u.name?.slice(0, 1) || u.email.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{u.name || "User"}</p>
                            <p className="text-[11px] text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === "admin"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-muted/80 text-foreground font-semibold">
                          ref={u.id.slice(0, 8)}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 text-right font-semibold">{u.ordersCount}</td>
                      <td className="py-3 text-right font-semibold">{u.scratchCardsCount}</td>
                      <td className="py-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                        ₹{u.confirmedBalance.toFixed(2)}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleInspectUser(u.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-muted hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          Inspect Activity
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: EARNLY CSV RECONCILIATION */}
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

      {/* USER DEEP-DIVE INSPECTOR MODAL */}
      {inspectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl bg-card border border-border p-6 shadow-2xl flex flex-col space-y-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center text-sm">
                  {inspectedUser.user.name?.slice(0, 1) || inspectedUser.user.email.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    {inspectedUser.user.name || "User Account"}
                  </h3>
                  <p className="text-xs text-muted-foreground">{inspectedUser.user.email}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectedUser(null)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Referral Intelligence Card */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Users className="h-3 w-3" /> Referral Tracking & Anti-Abuse
                </span>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
                  <div>
                    <p className="text-xs font-mono font-bold text-foreground">
                      Code: {inspectedUser.user.referralCode}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate max-w-sm">
                      {inspectedUser.user.referralLink}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inspectedUser.user.referralLink);
                      toast.success("Referral link copied!");
                    }}
                    className="py-1 px-3 rounded-lg border border-border hover:bg-muted text-[11px] font-semibold flex items-center gap-1 transition-colors flex-shrink-0"
                  >
                    <Copy className="h-3 w-3" /> Copy Link
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground bg-background/60 p-2 rounded-xl border border-border/60">
                  🛡️ <strong>Anti-Abuse Rule:</strong> Referral bonuses are unlocked strictly after the referred user completes their first verified order. Zero bonus for dummy signups.
                </p>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl border border-border bg-card">
                  <span className="text-[10px] text-muted-foreground block">Confirmed Wallet</span>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    ₹{inspectedUser.user.confirmedBalance.toFixed(2)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-border bg-card">
                  <span className="text-[10px] text-muted-foreground block">Tracked Orders</span>
                  <span className="text-sm font-extrabold text-foreground">
                    {inspectedUser.orders.length}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-border bg-card">
                  <span className="text-[10px] text-muted-foreground block">Total Clicks</span>
                  <span className="text-sm font-extrabold text-foreground">
                    {inspectedUser.clicks.length}
                  </span>
                </div>
              </div>

              {/* Click Sessions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <MousePointerClick className="h-3.5 w-3.5 text-emerald-500" />
                  Recent Shopper Click Sessions ({inspectedUser.clicks.length})
                </h4>
                {inspectedUser.clicks.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic">No clicks recorded yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {inspectedUser.clicks.map((c) => (
                      <div
                        key={c.id}
                        className="p-2 rounded-xl bg-muted/30 border border-border/80 flex items-center justify-between text-[11px]"
                      >
                        <div className="truncate max-w-xs">
                          <span className="font-semibold text-foreground">
                            {c.dealTitle || c.storeName || "Store Link"}
                          </span>
                          <span className="text-[10px] text-muted-foreground block font-mono">
                            SubID: {c.subId} {c.ipAddress ? `• IP: ${c.ipAddress}` : ""}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tracked Orders */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-blue-500" />
                  Tracked Orders ({inspectedUser.orders.length})
                </h4>
                {inspectedUser.orders.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic">No purchases tracked yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {inspectedUser.orders.map((o) => (
                      <div
                        key={o.id}
                        className="p-2.5 rounded-xl bg-muted/30 border border-border/80 flex items-center justify-between text-[11px]"
                      >
                        <div>
                          <span className="font-bold text-foreground">{o.storeName}</span>
                          <span className="text-[10px] text-muted-foreground block font-mono">
                            Order #{o.orderNumber} • Amount: ₹{o.orderAmount}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                            +₹{o.userRewardAmount} Reward
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-muted uppercase">
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* UPI Withdrawals */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-amber-500" />
                  UPI Payout Requests ({inspectedUser.payouts.length})
                </h4>
                {inspectedUser.payouts.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic">No withdrawal requests.</p>
                ) : (
                  <div className="space-y-1.5">
                    {inspectedUser.payouts.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl bg-muted/30 border border-border/80 flex items-center justify-between text-[11px]"
                      >
                        <div>
                          <span className="font-bold text-foreground">₹{p.amount.toFixed(2)}</span>
                          <span className="text-[10px] text-muted-foreground block font-mono">
                            UPI: {p.upiId} {p.utrReference ? `• UTR: ${p.utrReference}` : ""}
                          </span>
                        </div>
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
