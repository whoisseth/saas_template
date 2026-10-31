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
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  DollarSign,
  Smartphone,
  ShoppingCart,
  Link2,
  ChevronRight,
  ChevronLeft,
  ArrowDown,
  ArrowUpRight,
  CheckCheck,
  Landmark,
  Store,
  Eye,
  Info,
  Layers,
  Zap,
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
  const [activeTab, setActiveTab] = useState<"payouts" | "reconcile" | "clicks" | "users" | "flowchart">("payouts");

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

  // Manual Order Verification state
  const [manualSubId, setManualSubId] = useState("");
  const [manualStore, setManualStore] = useState("Amazon");
  const [manualOrderNum, setManualOrderNum] = useState("");
  const [manualCommission, setManualCommission] = useState("75");
  const [manualReward, setManualReward] = useState("20");
  const [isVerifyingManual, setIsVerifyingManual] = useState(false);

  // Storyboard & Flowchart state
  const [storyStep, setStoryStep] = useState<number>(1);
  const [storyViewMode, setStoryViewMode] = useState<"storyboard" | "pipeline" | "faq">("storyboard");
  const [faqFilter, setFaqFilter] = useState("");

  async function handleManualVerifyOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!manualSubId.trim()) {
      toast.error("Please enter a SubID or User Email");
      return;
    }

    setIsVerifyingManual(true);
    try {
      const res = await fetch("/api/admin/verify-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subId: manualSubId.trim().startsWith("u_") ? manualSubId.trim() : undefined,
          userEmailOrId: !manualSubId.trim().startsWith("u_") ? manualSubId.trim() : undefined,
          storeName: manualStore,
          orderNumber: manualOrderNum.trim() || undefined,
          commissionAmount: parseFloat(manualCommission) || 75,
          userRewardAmount: parseFloat(manualReward) || 20,
        }),
      });

      const data = (await res.json()) as { success?: boolean; message?: string; error?: string };
      if (res.ok && data.success) {
        toast.success(data.message || "Order verified and user wallet credited!");
        setManualSubId("");
        setManualOrderNum("");
        fetchOverview();
      } else {
        toast.error(data.error || "Failed to verify order");
      }
    } catch {
      toast.error("Connection error while verifying order");
    } finally {
      setIsVerifyingManual(false);
    }
  }

  async function handleSimulateQuickOrder(storeName: string, orderAmt: number, commAmt: number, rewardAmt: number) {
    const target = manualSubId.trim() || usersList[0]?.email || "utkarshseth2019@gmail.com";
    setIsVerifyingManual(true);
    try {
      const res = await fetch("/api/admin/verify-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmailOrId: target,
          storeName,
          orderNumber: `SIM_${storeName.toUpperCase()}_${Date.now().toString().slice(-6)}`,
          orderAmount: orderAmt,
          commissionAmount: commAmt,
          userRewardAmount: rewardAmt,
        }),
      });

      const data = (await res.json()) as { success?: boolean; message?: string; error?: string };
      if (res.ok && data.success) {
        toast.success(`🎉 Simulated ${storeName} Purchase! ₹${rewardAmt} credited to ${target}. Check your Wallet!`);
        fetchOverview();
      } else {
        toast.error(data.error || "Failed to simulate test order");
      }
    } catch {
      toast.error("Network error during test simulation");
    } finally {
      setIsVerifyingManual(false);
    }
  }

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

  async function handleRejectPayout(payoutId: string) {
    const reason = window.prompt(
      "Enter reason for rejection (this will be logged and the ₹ balance will be refunded to the user):",
      "Invalid UPI ID or account issue"
    );
    if (!reason) return;

    setProcessingId(payoutId);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutId,
          utrReference: reason,
          action: "reject",
        }),
      });

      const data = (await res.json()) as { success?: boolean; message?: string; error?: string };
      if (res.ok && data.success) {
        toast.success(data.message || "Payout rejected & refunded");
        setPayouts((prev) =>
          prev.map((p) => (p.id === payoutId ? { ...p, status: "REJECTED", utrReference: reason } : p))
        );
      } else {
        toast.error(data.error || "Failed to reject payout");
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
            Shopper Clicks ({totalClicks})
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
            Verify Orders & CSV
          </button>
          <button
            onClick={() => setActiveTab("flowchart")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "flowchart"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-emerald-600 dark:text-emerald-400 hover:text-foreground"
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>How It Works (Flowchart)</span>
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
                      <button
                        onClick={() => handleRejectPayout(p.id)}
                        disabled={processingId === p.id}
                        className="w-full sm:w-auto py-2 px-3 rounded-xl font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs transition-colors"
                        title="Reject and refund balance back to user wallet"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SHOPPER CLICKS & SUBID ATTRIBUTION */}
      {activeTab === "clicks" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4 text-emerald-500" />
                  Shopper Link Clicks & SubID Attribution Stream
                </h2>
                <p className="text-xs text-muted-foreground">
                  Live real-time feed of every link converted, the generated SubID, and the shopper identity.
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
                    <th className="pb-3 font-semibold">Time</th>
                    <th className="pb-3 font-semibold">SubID</th>
                    <th className="pb-3 font-semibold">Shopper / User</th>
                    <th className="pb-3 font-semibold">Merchant / Original URL</th>
                    <th className="pb-3 font-semibold text-right">Affiliate Route</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recentClicks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No shopper clicks logged yet. Share your store link converter!
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
                          <span className="px-2 py-0.5 rounded bg-muted/80 text-foreground font-semibold font-mono">
                            {click.subId}
                          </span>
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
                        <td className="py-2.5 max-w-xs truncate text-[11px]">
                          {click.dealTitle || click.originalUrl}
                        </td>
                        <td className="py-2.5 text-right">
                          <a
                            href={click.affiliateUrl || click.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5 font-semibold"
                          >
                            Open Link <ExternalLink className="h-2.5 w-2.5" />
                          </a>
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

      {/* TAB 4: MANUAL ORDER VERIFICATION & EARNLY CSV RECONCILIATION */}
      {activeTab === "reconcile" && (
        <div className="space-y-6">
          {/* Developer Testing Sandbox (1-Click Simulation Without Real Purchases) */}
          <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/[0.03] p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  🧪
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    Developer Test Sandbox (Instant Verification Without Real Purchases)
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Click any button below to instantly simulate a completed purchase. CashDeals immediately verifies the order, credits wallet cashback, and logs full audit records!
                  </p>
                </div>
              </div>
              <Link
                href="/wallet"
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground flex items-center gap-1 transition-colors flex-shrink-0"
              >
                <span>Open My Wallet</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isVerifyingManual}
                onClick={() => handleSimulateQuickOrder("Amazon", 1000, 75, 25)}
                className="py-2 px-3.5 rounded-xl font-bold bg-background hover:bg-muted border border-border text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 text-foreground"
              >
                <span>🛒 Simulate Amazon Order</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold">+₹25 Cashback</span>
              </button>

              <button
                type="button"
                disabled={isVerifyingManual}
                onClick={() => handleSimulateQuickOrder("Flipkart", 2500, 180, 60)}
                className="py-2 px-3.5 rounded-xl font-bold bg-background hover:bg-muted border border-border text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 text-foreground"
              >
                <span>⚡ Simulate Flipkart Order</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-bold">+₹60 Cashback (Unlocks UPI)</span>
              </button>

              <button
                type="button"
                disabled={isVerifyingManual}
                onClick={() => handleSimulateQuickOrder("Myntra", 1500, 120, 40)}
                className="py-2 px-3.5 rounded-xl font-bold bg-background hover:bg-muted border border-border text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 text-foreground"
              >
                <span>👗 Simulate Myntra Order</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-600 dark:text-pink-400 font-mono font-bold">+₹40 Cashback</span>
              </button>
            </div>
          </div>

          {/* Section 1: Manual SubID / Order Verification */}
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.02] p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground">Verify Individual Order & Credit User</h2>
                <p className="text-xs text-muted-foreground">
                  Found a purchase in your Amazon Associates or Earnly report? Enter the SubID or User Email to instantly credit the user&apos;s wallet with cashback.
                </p>
              </div>
            </div>

            <form onSubmit={handleManualVerifyOrder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">
                    SubID or User Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualSubId}
                    onChange={(e) => setManualSubId(e.target.value)}
                    placeholder="e.g. u_cm7x... or buyer@gmail.com"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    From your Amazon tag or Earnly report
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">Store Platform</label>
                  <select
                    value={manualStore}
                    onChange={(e) => setManualStore(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="Amazon">Amazon.in</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="Myntra">Myntra</option>
                    <option value="Ajio">Ajio</option>
                    <option value="Other">Other / Earnly</option>
                  </select>
                  <p className="text-[10px] text-muted-foreground">Merchant of purchase</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">Order ID / Ref (Optional)</label>
                  <input
                    type="text"
                    value={manualOrderNum}
                    onChange={(e) => setManualOrderNum(e.target.value)}
                    placeholder="e.g. 402-819281-91823"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">For user audit trail</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">
                    Affiliate Commission You Received (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={manualCommission}
                    onChange={(e) => {
                      const comm = e.target.value;
                      setManualCommission(comm);
                      const parsed = parseFloat(comm);
                      if (!isNaN(parsed) && parsed > 0) {
                        // Auto suggest ~27% reward to user
                        const suggested = Math.max(5, Math.round(parsed * 0.27));
                        setManualReward(suggested.toString());
                      }
                    }}
                    placeholder="75.00"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Actual commission earned by CashDeals (you keep ≥70%)
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">
                    Cashback Reward Credited to User (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={manualReward}
                    onChange={(e) => setManualReward(e.target.value)}
                    placeholder="20.00"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-600 dark:text-emerald-400"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Cashback credited directly into user&apos;s withdrawable wallet
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                  <span>
                    Crediting instantly confirms balance and awards a scratch card record to the user.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingManual}
                  className="w-full sm:w-auto py-2.5 px-6 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-60"
                >
                  {isVerifyingManual ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Verifying & Crediting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verify Order & Credit Wallet
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="rounded-2xl border border-border bg-muted/30 p-3.5 text-xs text-muted-foreground space-y-1">
              <p className="font-bold text-foreground flex items-center gap-1">
                💡 How You Verify User Orders from Your Affiliate Accounts:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
                <li>
                  <strong className="text-foreground">Amazon Associates:</strong> Go to Reports &rarr; Earnings Report &rarr; Tracking ID / SubID. Copy the <code className="px-1 py-0.5 rounded bg-muted font-mono font-bold">u_...</code> SubID.
                </li>
                <li>
                  <strong className="text-foreground">Earnly.in:</strong> Open your Earnly Dashboard &rarr; Transactions. Copy the SubID or User Tag.
                </li>
                <li>
                  Paste it in the box above, review the commission and reward, and hit <strong className="text-emerald-600 dark:text-emerald-400">Verify Order</strong>. Done!
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2: Earnly CSV Bulk Ingestion */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">Or Bulk Reconcile via CSV Report</h2>
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
                  "Run Bulk CSV Reconciliation"
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
        </div>
      )}

      {/* TAB 5: HOW IT WORKS - INTERACTIVE STORYBOARD & ARCHITECTURE FLOWCHART */}
      {activeTab === "flowchart" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] via-teal-500/[0.04] to-background p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <ShieldCheck className="h-4 w-4" />
                <span>Non-Developer Admin & User Operations Guide</span>
              </div>
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/80 border border-border text-xs font-bold">
                <button
                  onClick={() => setStoryViewMode("storyboard")}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    storyViewMode === "storyboard"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🎬 Interactive Storyboard
                </button>
                <button
                  onClick={() => setStoryViewMode("pipeline")}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    storyViewMode === "pipeline"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🔄 Architecture Pipeline
                </button>
                <button
                  onClick={() => setStoryViewMode("faq")}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    storyViewMode === "faq"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  💡 Admin Problem Solver & FAQ
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                How CashDeals Works: The Visual Storyboard
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
                Step-by-step walkthrough showing exactly what the <strong>User sees</strong>, what the <strong>Merchant (Amazon/Flipkart) tracks</strong>, how the <strong>Admin verifies orders</strong>, and how <strong>₹50 UPI withdrawals</strong> are requested and paid via PhonePe/GPay.
              </p>
            </div>
          </div>

          {/* VIEW MODE 1: INTERACTIVE STORYBOARD */}
          {storyViewMode === "storyboard" && (
            <div className="space-y-6">
              {/* Step Navigation Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {[
                  { step: 1, title: "1. Paste Link", role: "Shopper", icon: Link2 },
                  { step: 2, title: "2. Store Checkout", role: "Amazon/Flipkart", icon: ShoppingCart },
                  { step: 3, title: "3. Earnly Report", role: "Affiliate", icon: TrendingUp },
                  { step: 4, title: "4. Admin Verify", role: "Admin", icon: CheckCircle2 },
                  { step: 5, title: "5. User UPI Entry", role: "Wallet (₹50)", icon: Wallet },
                  { step: 6, title: "6. Admin Payout", role: "PhonePe / QR", icon: QrCode },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = storyStep === item.step;
                  return (
                    <button
                      key={item.step}
                      onClick={() => setStoryStep(item.step)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isActive
                          ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                          : "border-border bg-card hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold text-muted-foreground uppercase">
                          {item.role}
                        </span>
                        <Icon className={`h-3.5 w-3.5 ${isActive ? "text-emerald-500" : "text-muted-foreground"}`} />
                      </div>
                      <p className={`text-xs font-bold truncate ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                        {item.title}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* ACTIVE STORYBOARD SCENE */}
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
                {/* SCENE 1: LINK CONVERSION */}
                {storyStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border pb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black">
                          SCENE 1 OF 6
                        </span>
                        <h3 className="text-lg font-bold text-foreground">
                          Shopper Converts Product Link on CashDeals
                        </h3>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-xl">
                        User Interface: <code className="font-mono text-foreground font-bold">cashdeals.in/#convert</code>
                      </span>
                    </div>

                    {/* Realistic UI Mockup: CashDeals Convert Box */}
                    <div className="rounded-2xl border-2 border-muted bg-neutral-950 p-4 sm:p-6 text-white space-y-4 shadow-xl">
                      <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-neutral-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-rose-500 inline-block" />
                          <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" />
                          <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
                          <span className="font-mono ml-2 text-neutral-300">https://cashdeals.in</span>
                        </div>
                        <span className="font-semibold text-emerald-400">Cashback Engine Active</span>
                      </div>

                      <div className="max-w-xl mx-auto space-y-3 py-2">
                        <label className="text-xs font-bold text-neutral-300 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-emerald-400" />
                          Paste Any Product Link (Amazon, Flipkart, Myntra)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            value="https://www.amazon.in/dp/B0CX21C8S4?ref=boat-air-dopes-141"
                            className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-3.5 py-2.5 text-xs text-neutral-200 font-mono pr-28 select-all"
                          />
                          <button
                            type="button"
                            className="absolute right-1 top-1 bottom-1 px-3 rounded-lg bg-emerald-500 text-neutral-950 font-bold text-xs flex items-center gap-1 shadow"
                          >
                            Generate Link
                          </button>
                        </div>

                        {/* Generated Output */}
                        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Affiliate Tracking Link Generated:
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-bold">
                              SubID: u_cm7x89_a1b2
                            </span>
                          </div>
                          <p className="font-mono text-[11px] text-neutral-300 break-all bg-neutral-900/80 p-2 rounded-lg">
                            https://cashdeals.in/go?subId=u_cm7x89_a1b2&store=amazon
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Explanatory Storyboard Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1.5">
                        <strong className="text-foreground block font-bold text-sm">1. What the User Does:</strong>
                        <p className="text-muted-foreground leading-relaxed">
                          The shopper copies any product link from Amazon or Flipkart, pastes it on CashDeals, and taps <strong>&ldquo;Generate Link&rdquo;</strong>.
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300 space-y-1.5">
                        <strong className="text-emerald-700 dark:text-emerald-200 block font-bold text-sm">2. What CashDeals Does Invisibly:</strong>
                        <p className="leading-relaxed">
                          CashDeals generates a cryptographically unique SubID (e.g. <code className="bg-emerald-500/20 px-1 rounded font-mono font-bold">u_cm7x89_a1b2</code>) and immediately saves it in the database with the user&apos;s account ID, current time, and store name.
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1.5">
                        <strong className="text-foreground block font-bold text-sm">3. The Real-Life Analogy:</strong>
                        <p className="text-muted-foreground leading-relaxed">
                          Like attaching a luggage barcode tag at the airport check-in counter. Even if the bag flies 1,000 miles across multiple cargo planes, the tag always points back to that specific passenger.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SCENE 2: STORE CHECKOUT */}
                {storyStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border pb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-black">
                          SCENE 2 OF 6
                        </span>
                        <h3 className="text-lg font-bold text-foreground">
                          User Buys on Amazon / Flipkart with SubID Attached
                        </h3>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-xl">
                        Merchant Interface: <code className="font-mono text-foreground font-bold">amazon.in / flipkart.com</code>
                      </span>
                    </div>

                    {/* Realistic UI Mockup: Amazon Checkout */}
                    <div className="rounded-2xl border-2 border-muted bg-[#232f3e] p-4 sm:p-6 text-white space-y-4 shadow-xl">
                      <div className="flex items-center justify-between text-xs text-neutral-300 border-b border-neutral-700 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-rose-500 inline-block" />
                          <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" />
                          <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
                          <span className="font-mono ml-2 text-neutral-200 truncate max-w-xs sm:max-w-md">
                            https://www.amazon.in/checkout?ascsubtag=u_cm7x89_a1b2
                          </span>
                        </div>
                        <span className="text-amber-400 font-bold hidden sm:inline">Amazon Checkout</span>
                      </div>

                      <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-700 text-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm text-neutral-100">boAt Airdopes 141 Bluetooth Earbuds</p>
                            <p className="text-[11px] text-neutral-400">Sold by boAt Lifestyle • Delivered by Amazon</p>
                          </div>
                          <span className="text-base font-extrabold text-white">₹1,299.00</span>
                        </div>

                        <div className="pt-2 border-t border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
                          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Paid successfully via UPI (Google Pay)
                          </span>
                          <span className="font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/30">
                            Affiliate Tag Logged: ascsubtag=u_cm7x89_a1b2
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Explanatory Storyboard Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                        <strong className="text-foreground block font-bold text-sm">
                          🛒 How Amazon Knows This Purchase Came From CashDeals:
                        </strong>
                        <p className="text-muted-foreground leading-relaxed">
                          When the user clicks the CashDeals redirect link, our server forwards the user to Amazon with your affiliate tag (<code className="px-1 rounded bg-muted font-mono font-bold">cashdeals-21</code>) and the user&apos;s SubID (<code className="px-1 rounded bg-muted font-mono font-bold">ascsubtag=u_cm7x89_a1b2</code>). Amazon&apos;s cart engine securely stores this SubID alongside the purchase!
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                        <strong className="text-foreground block font-bold text-sm">
                          🔒 Why Bank Privacy is 100% Protected:
                        </strong>
                        <p className="text-muted-foreground leading-relaxed">
                          Amazon, Flipkart, and RBI banking guidelines strictly forbid sharing credit card numbers or UPI PINs. We never see or store the user&apos;s bank cards. Instead, Amazon only shares: <em>&ldquo;Order completed under SubID u_cm7x89_a1b2&rdquo;</em>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SCENE 3: EARNLY TRANSACTION REPORT */}
                {storyStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border pb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black">
                          SCENE 3 OF 6
                        </span>
                        <h3 className="text-lg font-bold text-foreground">
                          Earnly.in / Merchant Registers Verified Sale
                        </h3>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-xl">
                        Affiliate Portal: <code className="font-mono text-foreground font-bold">earnly.in / Amazon Associates</code>
                      </span>
                    </div>

                    {/* Realistic UI Mockup: Earnly Report Table */}
                    <div className="rounded-2xl border-2 border-muted bg-card p-4 sm:p-6 text-foreground space-y-4 shadow-sm border border-border">
                      <div className="flex items-center justify-between border-b border-border pb-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                          <span className="font-bold">Earnly Publisher Dashboard — Transaction History</span>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">Publisher ID: c7zko6s5mfo</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className="border-b border-border text-[11px] text-muted-foreground uppercase tracking-wider">
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3">SubID (Tag)</th>
                              <th className="py-2 px-3">Store</th>
                              <th className="py-2 px-3">Order Amount</th>
                              <th className="py-2 px-3">Commission Owed</th>
                              <th className="py-2 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            <tr className="bg-emerald-500/[0.07] font-semibold">
                              <td className="py-2.5 px-3 text-muted-foreground">Today, 14:32</td>
                              <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-bold">u_cm7x89_a1b2</td>
                              <td className="py-2.5 px-3">Amazon India</td>
                              <td className="py-2.5 px-3">₹1,299.00</td>
                              <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-extrabold">+₹80.00</td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                                  Approved
                                </span>
                              </td>
                            </tr>
                            <tr className="text-muted-foreground">
                              <td className="py-2 px-3">Yesterday</td>
                              <td className="py-2 px-3 font-mono">u_cm7a12_k9j8</td>
                              <td className="py-2 px-3">Flipkart</td>
                              <td className="py-2 px-3">₹2,499.00</td>
                              <td className="py-2 px-3 font-bold">+₹140.00</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                                  Approved
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Explanatory Storyboard Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                        <strong className="text-foreground block font-bold text-sm">
                          🔍 How Admin Verifies the Item Was Purchased ONLY on Our Platform:
                        </strong>
                        <p className="text-muted-foreground leading-relaxed">
                          Notice the SubID column above: <code className="px-1 py-0.5 rounded bg-muted font-mono font-bold text-foreground">u_cm7x89_a1b2</code>. This code was generated exclusively by CashDeals. If a user buys directly on Amazon without our link, Amazon will <strong>never</strong> record that SubID in your Earnly report. The presence of that SubID in Earnly is mathematical proof the user clicked through CashDeals!
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                        <strong className="text-foreground block font-bold text-sm">
                          🛡️ Return Window Protection (Zero Loss Guarantee):
                        </strong>
                        <p className="text-muted-foreground leading-relaxed">
                          If the customer cancels the order or returns the earbuds within 7 days, Amazon automatically marks the status as <strong>CANCELLED</strong> and does not credit the ₹80. You only verify and reward orders with status <strong>Approved</strong>. Thus, you will never pay cashback out of your own pocket.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SCENE 4: ADMIN VERIFICATION & PROFIT SPLIT */}
                {storyStep === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border pb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                          SCENE 4 OF 6
                        </span>
                        <h3 className="text-lg font-bold text-foreground">
                          Admin Verifies Order & Locks Platform Profit
                        </h3>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-xl">
                        Admin Interface: <code className="font-mono text-foreground font-bold">/admin (Verify Orders tab)</code>
                      </span>
                    </div>

                    {/* Realistic UI Mockup: CashDeals Admin Form */}
                    <div className="rounded-2xl border-2 border-border bg-card p-4 sm:p-6 text-foreground space-y-4 shadow-sm">
                      <div className="flex items-center justify-between border-b border-border pb-3 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="font-bold">CashDeals Manual Order Verifier</span>
                        </div>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                          Automatic User Matching Active
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[11px] font-bold text-muted-foreground block">
                            Enter SubID from Earnly Report:
                          </label>
                          <input
                            type="text"
                            readOnly
                            value="u_cm7x89_a1b2"
                            className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 font-mono font-bold text-foreground"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground block">
                            Store:
                          </label>
                          <input
                            type="text"
                            readOnly
                            value="Amazon"
                            className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 font-bold text-foreground"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground block">
                            Earnly Commission (₹):
                          </label>
                          <input
                            type="text"
                            readOnly
                            value="₹80.00"
                            className="w-full rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 font-mono font-extrabold text-emerald-600 dark:text-emerald-400"
                          />
                        </div>
                      </div>

                      {/* Profit Breakdown Preview */}
                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            Guaranteed Profit Split Breakdown:
                          </span>
                          <p className="text-[11px] text-muted-foreground">
                            Target User: <strong className="text-foreground font-mono">rahul@gmail.com</strong> (matched from SubID)
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-muted-foreground block">Your Admin Profit (70%)</span>
                            <span className="text-sm font-extrabold text-foreground">₹56.00</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">User Cashback (30%)</span>
                            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">₹24.00</span>
                          </div>
                          <button
                            type="button"
                            className="py-2 px-4 rounded-xl font-bold bg-emerald-600 text-white text-xs shadow-sm hover:bg-emerald-700 transition-colors"
                          >
                            Verify & Credit
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Explanatory Storyboard Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                        <strong className="text-foreground block font-bold text-sm">
                          ⚡ 1-Click Verification:
                        </strong>
                        <p className="text-muted-foreground leading-relaxed">
                          You do not need to look up who <code className="font-mono font-bold">u_cm7x89_a1b2</code> belongs to! Simply paste the SubID from your Earnly dashboard into the form and enter your commission. CashDeals instantly detects the user account and credits their wallet with their ₹24 cashback.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                        <strong className="text-foreground block font-bold text-sm">
                          💼 Bulk Verification via CSV:
                        </strong>
                        <p className="text-muted-foreground leading-relaxed">
                          Have 50 orders in a month? Don&apos;t do it one by one! Click &ldquo;Download Report&rdquo; in Earnly to get a CSV file, then drag and drop it into the <strong>Verify Orders & CSV</strong> tab. CashDeals reconciles all 50 orders in 2 seconds automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SCENE 5: USER REQUESTS UPI PAYOUT */}
                {storyStep === 5 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border pb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-black">
                          SCENE 5 OF 6
                        </span>
                        <h3 className="text-lg font-bold text-foreground">
                          User Reaches ₹50 & Adds UPI ID on /wallet
                        </h3>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-xl">
                        User Interface: <code className="font-mono text-foreground font-bold">cashdeals.in/wallet</code>
                      </span>
                    </div>

                    {/* Realistic UI Mockup: User Wallet & UPI Withdrawal Modal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: User Wallet Card */}
                      <div className="rounded-3xl p-6 bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-widest text-emerald-200">
                            Confirmed Wallet
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-sm">
                            UPI Ready
                          </span>
                        </div>
                        <div>
                          <span className="text-4xl font-extrabold tracking-tight">₹54.00</span>
                          <span className="text-xs text-emerald-200 block mt-1">Available for instant UPI withdrawal</span>
                        </div>
                        <button
                          type="button"
                          className="w-full py-3 px-4 rounded-2xl font-bold bg-white text-emerald-800 hover:bg-emerald-50 transition-all shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                          Withdraw to UPI (Min ₹50)
                        </button>
                      </div>

                      {/* Right: Withdrawal Drawer Modal */}
                      <div className="rounded-3xl border-2 border-border bg-card p-5 space-y-3.5 shadow-md">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                          <h4 className="font-bold text-sm flex items-center gap-1.5">
                            <Wallet className="h-4 w-4 text-emerald-500" />
                            Withdraw to Any UPI ID
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Free Transfer
                          </span>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-muted-foreground block">
                            Enter Your UPI ID (VPA):
                          </label>
                          <input
                            type="text"
                            readOnly
                            value="9876543210@paytm"
                            className="w-full rounded-xl border border-emerald-500/40 bg-emerald-500/[0.05] px-3 py-2 text-xs font-mono font-bold text-foreground"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Supports Google Pay, PhonePe, Paytm, BHIM & all Indian banks.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground block">
                            Withdrawal Amount:
                          </label>
                          <input
                            type="text"
                            readOnly
                            value="₹50.00"
                            className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-bold text-foreground"
                          />
                        </div>

                        <button
                          type="button"
                          className="w-full py-2.5 rounded-xl font-bold bg-emerald-600 text-white text-xs flex items-center justify-center gap-1 shadow hover:bg-emerald-700"
                        >
                          Confirm Withdrawal <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Explanatory Storyboard Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300 space-y-2">
                        <strong className="text-emerald-700 dark:text-emerald-200 block font-bold text-sm">
                          📍 Direct Answer: Where Does the User Add Their UPI ID?
                        </strong>
                        <p className="leading-relaxed">
                          The user goes to <code className="bg-emerald-500/20 px-1 rounded font-mono font-bold">/wallet</code> (accessible from the top header or mobile bottom bar). As soon as their confirmed balance reaches ₹50, the button &ldquo;Withdraw to UPI (Min ₹50)&rdquo; unlocks. Clicking it opens the popup above where they type their UPI ID (e.g. <code className="font-mono font-bold">9876543210@paytm</code> or <code className="font-mono font-bold">rahul@okhdfcbank</code>) and click Confirm.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                        <strong className="text-foreground block font-bold text-sm">
                          🔒 Double-Spend Prevention:
                        </strong>
                        <p className="text-muted-foreground leading-relaxed">
                          The second the user taps Confirm, ₹50 is deducted from their available balance and marked as <code className="px-1 rounded bg-muted font-mono font-bold">WITHDRAWAL_LOCK</code>. The user cannot spend or withdraw that ₹50 again while it is pending review.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SCENE 6: ADMIN SCANS QR & SENDS MONEY */}
                {storyStep === 6 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border pb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                          SCENE 6 OF 6
                        </span>
                        <h3 className="text-lg font-bold text-foreground">
                          Admin Scans Dynamic QR & Fulfills UPI Payout
                        </h3>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-xl">
                        Admin Interface: <code className="font-mono text-foreground font-bold">/admin (UPI Payouts tab)</code>
                      </span>
                    </div>

                    {/* Realistic UI Mockup: Admin UPI Payouts Screen */}
                    <div className="rounded-2xl border-2 border-border bg-card p-4 sm:p-6 text-foreground space-y-4 shadow-sm">
                      <div className="flex items-center justify-between border-b border-border pb-3 text-xs">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4 text-emerald-500" />
                          <span className="font-bold">CashDeals Admin — UPI Payouts Queue</span>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          1 Pending Request
                        </span>
                      </div>

                      {/* Pending Row with Dynamic QR Code */}
                      <div className="p-4 rounded-2xl border border-border bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Dynamic QR Code Mockup */}
                        <div className="p-2.5 rounded-2xl bg-white border border-border shadow-sm flex-shrink-0 text-center mx-auto sm:mx-0">
                          <div className="h-28 w-28 rounded bg-neutral-900 flex flex-col items-center justify-center text-white p-2 text-center">
                            <QrCode className="h-12 w-12 text-white mb-1" />
                            <span className="text-[8px] font-mono font-bold text-emerald-400">Scan on PhonePe</span>
                          </div>
                          <span className="text-[9px] font-bold text-neutral-600 block mt-1">
                            Pay ₹50.00
                          </span>
                        </div>

                        {/* Request Details */}
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-extrabold text-foreground">₹50.00</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              PENDING
                            </span>
                          </div>
                          <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            UPI ID: 9876543210@paytm
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            User: Rahul Sharma (rahul@gmail.com) • Requested 5 mins ago
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Source: ₹24 boAt Earbuds Cashback + ₹30 Welcome Bonus
                          </p>
                        </div>

                        {/* Admin Action Box */}
                        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value="503198274102"
                            placeholder="Enter 12-digit UTR..."
                            className="w-full sm:w-44 rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                          />
                          <button
                            type="button"
                            className="w-full sm:w-auto py-2 px-4 rounded-xl font-bold bg-emerald-600 text-white text-xs shadow hover:bg-emerald-700"
                          >
                            Mark Paid
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Explanatory Storyboard Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300 space-y-2">
                        <strong className="text-emerald-700 dark:text-emerald-200 block font-bold text-sm">
                          📍 Direct Answer: Where Does the Admin See the Payment & Send Money?
                        </strong>
                        <p className="leading-relaxed">
                          In this Admin Center under the <strong>&ldquo;UPI Payouts&rdquo;</strong> tab (the very first tab). You will see the exact screen above! CashDeals automatically calculates the amount and generates a live UPI QR code containing the user&apos;s UPI ID and the exact ₹50 amount.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                        <strong className="text-foreground block font-bold text-sm">
                          📱 How the Admin Completes Payment in 10 Seconds:
                        </strong>
                        <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
                          <li>Open PhonePe, Google Pay, or Paytm on your smartphone.</li>
                          <li>Scan the QR code displayed on your admin screen.</li>
                          <li>Enter your bank UPI PIN. ₹50 is sent directly to the user&apos;s bank.</li>
                          <li>Copy the 12-digit bank UTR / Reference number from PhonePe, paste it into the box, and tap <strong>Mark Paid</strong>.</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Storyboard Prev/Next Controls */}
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <button
                    onClick={() => setStoryStep((prev) => Math.max(1, prev - 1))}
                    disabled={storyStep === 1}
                    className="py-2 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous Step
                  </button>
                  <span className="text-xs text-muted-foreground font-semibold">
                    Step {storyStep} of 6
                  </span>
                  <button
                    onClick={() => setStoryStep((prev) => Math.min(6, prev + 1))}
                    disabled={storyStep === 6}
                    className="py-2 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    Next Step <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: ARCHITECTURE PIPELINE (VISUAL ARROWS) */}
          {storyViewMode === "pipeline" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
                <div className="border-b border-border pb-4">
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    End-to-End System Data Flow Pipeline
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Visual diagram showing how data, SubIDs, commissions, and money travel across systems.
                  </p>
                </div>

                {/* Vertical / Horizontal Flow Nodes */}
                <div className="space-y-4">
                  {/* Pipeline Node 1 */}
                  <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/[0.04] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold flex items-center justify-center text-sm flex-shrink-0">
                        1
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Shopper Interface</span>
                        <h4 className="text-sm font-bold text-foreground">User Pastes Link on CashDeals</h4>
                        <p className="text-xs text-muted-foreground">Product URL: https://amazon.in/dp/... → CashDeals assigns unique SubID <code className="font-mono font-bold text-foreground">u_cm7x89_a1b2</code></p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold whitespace-nowrap">
                      Writes to: clicks table
                    </span>
                  </div>

                  {/* Flow Arrow */}
                  <div className="flex justify-center -my-2 text-muted-foreground">
                    <ArrowDown className="h-5 w-5 text-emerald-500 animate-bounce" />
                  </div>

                  {/* Pipeline Node 2 */}
                  <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-500/[0.04] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold flex items-center justify-center text-sm flex-shrink-0">
                        2
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Merchant Gateway</span>
                        <h4 className="text-sm font-bold text-foreground">User Buys & Completes Payment on Amazon / Flipkart</h4>
                        <p className="text-xs text-muted-foreground">Amazon records payment: ₹1,299 via UPI. Affiliate engine tags cart with <code className="font-mono font-bold text-foreground">ascsubtag=u_cm7x89_a1b2</code></p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold whitespace-nowrap">
                      Amazon Affiliate Tagged
                    </span>
                  </div>

                  {/* Flow Arrow */}
                  <div className="flex justify-center -my-2 text-muted-foreground">
                    <ArrowDown className="h-5 w-5 text-emerald-500 animate-bounce" />
                  </div>

                  {/* Pipeline Node 3 */}
                  <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold flex items-center justify-center text-sm flex-shrink-0">
                        3
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Affiliate Clearing</span>
                        <h4 className="text-sm font-bold text-foreground">Earnly.in Reports Confirmed Sale & ₹80 Commission</h4>
                        <p className="text-xs text-muted-foreground">After 7-day return period clears, Earnly logs: <code className="font-mono font-bold text-foreground">u_cm7x89_a1b2 | ₹1,299 GMV | ₹80 Commission | Approved</code></p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold whitespace-nowrap">
                      Earnly Transaction Log
                    </span>
                  </div>

                  {/* Flow Arrow */}
                  <div className="flex justify-center -my-2 text-muted-foreground">
                    <ArrowDown className="h-5 w-5 text-emerald-500 animate-bounce" />
                  </div>

                  {/* Pipeline Node 4 */}
                  <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center text-sm flex-shrink-0">
                        4
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Platform Admin Center</span>
                        <h4 className="text-sm font-bold text-foreground">Admin Enters SubID & Executes Guaranteed Profit Split</h4>
                        <p className="text-xs text-muted-foreground">Platform retains <strong>₹56.00 pure profit</strong> (70%). User receives <strong>₹24.00 cashback</strong> credited to wallet.</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                      Wallet Ledger Credited
                    </span>
                  </div>

                  {/* Flow Arrow */}
                  <div className="flex justify-center -my-2 text-muted-foreground">
                    <ArrowDown className="h-5 w-5 text-emerald-500 animate-bounce" />
                  </div>

                  {/* Pipeline Node 5 */}
                  <div className="p-4 rounded-2xl border border-teal-500/30 bg-teal-500/[0.04] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 font-extrabold flex items-center justify-center text-sm flex-shrink-0">
                        5
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">User Wallet Screen</span>
                        <h4 className="text-sm font-bold text-foreground">User Confirms ₹50 Balance & Enters UPI ID (VPA)</h4>
                        <p className="text-xs text-muted-foreground">User clicks &ldquo;Withdraw to UPI&rdquo; on /wallet, enters <code className="font-mono font-bold text-foreground">9876543210@paytm</code>, ₹50 locked in ledger.</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold whitespace-nowrap">
                      Queued in payoutRequests
                    </span>
                  </div>

                  {/* Flow Arrow */}
                  <div className="flex justify-center -my-2 text-muted-foreground">
                    <ArrowDown className="h-5 w-5 text-emerald-500 animate-bounce" />
                  </div>

                  {/* Pipeline Node 6 */}
                  <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm flex-shrink-0">
                        6
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Banking Settlement</span>
                        <h4 className="text-sm font-bold text-foreground">Admin Scans PhonePe QR, Transfers ₹50, and Enters UTR</h4>
                        <p className="text-xs text-muted-foreground">Admin marks PAID with 12-digit UTR. User receives ₹50 directly in their Indian bank account!</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono bg-emerald-600 text-white font-bold whitespace-nowrap">
                      Completed & Settled
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 3: ADMIN PROBLEM SOLVER & FAQ */}
          {storyViewMode === "faq" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Highlighted Spotlight Cards Answering User's Specific Questions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Spotlight 1: Where User Adds UPI */}
                <div className="p-5 rounded-3xl border-2 border-teal-500/40 bg-teal-500/[0.05] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-700 dark:text-teal-300">
                      USER PERSPECTIVE
                    </span>
                    <Wallet className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h4 className="font-extrabold text-sm text-foreground">
                    Where does a user with ₹50 add their UPI ID?
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    On the <strong>My Earnings (/wallet)</strong> page. As soon as the user&apos;s confirmed balance reaches ₹50, the &ldquo;Withdraw to UPI (Min ₹50)&rdquo; button becomes clickable. When clicked, a modal pops up asking for their UPI ID (e.g. <code className="font-mono font-bold">9876543210@paytm</code>).
                  </p>
                  <Link
                    href="/wallet"
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline pt-1"
                  >
                    View User Wallet Page <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {/* Spotlight 2: Where Admin Sees Payment */}
                <div className="p-5 rounded-3xl border-2 border-emerald-500/40 bg-emerald-500/[0.05] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      ADMIN PERSPECTIVE
                    </span>
                    <QrCode className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="font-extrabold text-sm text-foreground">
                    Where does the admin see that user&apos;s payment and UPI ID?
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Under the <strong>UPI Payouts</strong> tab in this Admin Center. You will see the user&apos;s name, email, amount (₹50.00), exact UPI ID, and a scannable PhonePe/GPay QR code. You scan the QR, pay ₹50, type the 12-digit UTR, and tap &ldquo;Mark Paid&rdquo;.
                  </p>
                  <button
                    onClick={() => setActiveTab("payouts")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
                  >
                    Go to UPI Payouts Tab <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                {/* Spotlight 3: How Admin Verifies Item Was Clicked ONLY on Our Platform */}
                <div className="p-5 rounded-3xl border-2 border-blue-500/40 bg-blue-500/[0.05] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-700 dark:text-blue-300">
                      CORE PROBLEM SOLVED
                    </span>
                    <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-extrabold text-sm text-foreground">
                    How does the admin verify the item was clicked ONLY on our platform?
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Via the <strong>SubID</strong>! Every link generated on CashDeals creates an exclusive tag like <code className="font-mono font-bold">u_cm7x89_a1b2</code> recorded in our <code className="font-mono font-bold">clicks</code> table. When Earnly or Amazon reports an order with that SubID, it is mathematically impossible to have come from anywhere else!
                  </p>
                  <button
                    onClick={() => setActiveTab("clicks")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1"
                  >
                    View Shopper Clicks Table <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Comprehensive Accordion Q&A */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-emerald-500" />
                    Frequently Asked Operational Questions (Plain English)
                  </h3>
                  <input
                    type="text"
                    value={faqFilter}
                    onChange={(e) => setFaqFilter(e.target.value)}
                    placeholder="Search questions..."
                    className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Q1 */}
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                    <h4 className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                      <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center font-bold">1</span>
                      What happens if the customer cancels or returns the item?
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Neither Amazon nor Flipkart ever pays affiliate commission on returned or cancelled orders. They maintain a 7-day return safety window. If a customer returns the item, the merchant automatically marks the commission as <strong>CANCELLED</strong> in Earnly. Because you only verify and credit orders that appear as confirmed in your monthly report, you will <strong>never</strong> pay cashback on a returned or fake item.
                    </p>
                  </div>

                  {/* Q2 */}
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                    <h4 className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                      <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center font-bold">2</span>
                      Can a user fake their balance or manipulate numbers?
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      <strong>Zero possibility.</strong> Users have zero database write permissions. All wallet balances are derived dynamically from an append-only, tamper-proof financial ledger on the server (<code className="font-mono font-bold">wallet_ledger</code>). A balance can only increase when you (the admin) verify an order or when an Earnly CSV report is uploaded.
                    </p>
                  </div>

                  {/* Q3 */}
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                    <h4 className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                      <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center font-bold">3</span>
                      How is our platform profit guaranteed?
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      You are in full control of the profit split! When you receive ₹100 commission from Earnly, you typically credit ₹25 or ₹30 to the user as cashback. The remaining <strong>₹70 to ₹75 stays directly with you as platform net profit</strong>. You never pay out more than what the merchant has confirmed.
                    </p>
                  </div>

                  {/* Q4 */}
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                    <h4 className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                      <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center font-bold">4</span>
                      How do we add multiple team members as admins?
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      In your project&apos;s <code className="px-1 py-0.5 rounded bg-muted font-mono font-bold text-foreground">.env.local</code> file, add multiple email addresses separated by commas:
                      <br />
                      <code className="block mt-1 p-2 rounded bg-muted/80 font-mono text-[11px] text-foreground">
                        ADMIN_EMAILS=&quot;utkarshseth2019@gmail.com,partner@gmail.com,accountant@gmail.com&quot;
                      </code>
                      Anyone who logs in with one of these emails gets instant, full administrative access.
                    </p>
                  </div>

                  {/* Q5 */}
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                    <h4 className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                      <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center font-bold">5</span>
                      What happens if an admin rejects an invalid UPI ID?
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      If a user entered an incorrect UPI ID (e.g. typos or dormant bank account), simply click the <strong>&ldquo;Reject&rdquo;</strong> button in the UPI Payouts tab. The system marks the request as REJECTED and immediately refunds the locked ₹50 back to the user&apos;s wallet so they can re-enter their correct UPI ID!
                    </p>
                  </div>

                  {/* Q6 */}
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                    <h4 className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                      <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center font-bold">6</span>
                      How can I test the whole flow right now as a developer?
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Go to the <strong>Verify Orders & CSV</strong> tab and look at the top section: <em>&ldquo;1-Click Instant Developer Sandbox&rdquo;</em>. Tap <strong>&ldquo;Simulate Amazon Order&rdquo;</strong> or <strong>&ldquo;Simulate Flipkart Order&rdquo;</strong>. It will instantly simulate a real purchase, award cashback, and populate your wallet with ₹50 so you can test the UPI withdrawal in 5 seconds!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
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
