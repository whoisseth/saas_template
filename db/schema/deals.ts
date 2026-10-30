import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

// Supported Affiliate Stores (Flipkart, Amazon, Myntra, Ajio, etc.)
export const stores = sqliteTable("stores", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url").notNull(),
  cashbackText: text("cashback_text").notNull(), // e.g. "Up to 8% Cashback"
  affiliateBaseUrl: text("affiliate_base_url").notNull(),
  description: text("description"),
  category: text("category").notNull().default("General"),
  isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(true),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Curated & Trending Deals
export const deals = sqliteTable("deals", {
  id: text("id").primaryKey(),
  storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  originalPrice: real("original_price").notNull(),
  discountedPrice: real("discounted_price").notNull(),
  discountPercent: integer("discount_percent").notNull(),
  imageUrl: text("image_url").notNull(),
  targetUrl: text("target_url").notNull(),
  cashbackEstimate: text("cashback_estimate"), // e.g. "Flat ₹15 Cashback" or "Up to 8%"
  category: text("category").notNull().default("Electronics"),
  isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  clicksCount: integer("clicks_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (t) => [
  index("deals_store_idx").on(t.storeId),
  index("deals_featured_idx").on(t.isFeatured),
  index("deals_category_idx").on(t.category),
]);

// Click Tracking & SubID Attributions
export const clicks = sqliteTable("clicks", {
  id: text("id").primaryKey(),
  subId: text("sub_id").notNull().unique(), // e.g. "u12_c9a8f2"
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  storeId: text("store_id").references(() => stores.id, { onDelete: "set null" }),
  dealId: text("deal_id").references(() => deals.id, { onDelete: "set null" }),
  originalUrl: text("original_url").notNull(),
  affiliateUrl: text("affiliate_url").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (t) => [
  index("clicks_user_idx").on(t.userId),
  index("clicks_sub_idx").on(t.subId),
]);

// Tracked Orders (Reconciled from Earnly CSV reports or Webhooks)
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  orderNumber: text("order_number").notNull(), // Merchant / Earnly Transaction ID
  subId: text("sub_id").notNull(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  storeName: text("store_name").notNull(), // Flipkart, Amazon, etc.
  orderAmount: real("order_amount").notNull().default(0),
  commissionAmount: real("commission_amount").notNull().default(0),
  userRewardAmount: real("user_reward_amount").notNull().default(0), // Calculated reward
  status: text("status", { enum: ["TRACKED", "CONFIRMED", "CANCELLED"] }).notNull().default("TRACKED"),
  reconciledAt: integer("reconciled_at", { mode: "timestamp" }),
  expectedConfirmationDate: text("expected_confirmation_date"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (t) => [
  index("orders_user_idx").on(t.userId),
  index("orders_sub_idx").on(t.subId),
  index("orders_status_idx").on(t.status),
]);

// Gamified Scratch Cards (Unlocked when order status flips to CONFIRMED)
export const scratchCards = sqliteTable("scratch_cards", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
  rewardAmount: real("reward_amount").notNull(), // Guaranteed ₹1 to ₹20
  title: text("title").notNull().default("Shopping Reward"),
  isRevealed: integer("is_revealed", { mode: "boolean" }).notNull().default(false),
  revealedAt: integer("revealed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (t) => [
  index("scratch_user_idx").on(t.userId),
  index("scratch_revealed_idx").on(t.isRevealed),
]);

// Immutable Wallet Ledger (Financial Ledger)
export const walletLedger = sqliteTable("wallet_ledger", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["SCRATCH_REWARD", "REFERRAL_BONUS", "WITHDRAWAL_LOCK", "WITHDRAWAL_PAID", "REFUND"] }).notNull(),
  amount: real("amount").notNull(),
  status: text("status", { enum: ["PENDING", "CONFIRMED"] }).notNull().default("CONFIRMED"),
  referenceId: text("reference_id"), // scratchCardId, payoutRequestId, etc.
  description: text("description").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (t) => [
  index("wallet_user_idx").on(t.userId),
  index("wallet_type_idx").on(t.type),
]);

// UPI Payout Requests (Minimum ₹50 threshold)
export const payoutRequests = sqliteTable("payout_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  upiId: text("upi_id").notNull(),
  status: text("status", { enum: ["PENDING", "APPROVED", "PAID", "REJECTED"] }).notNull().default("PENDING"),
  utrReference: text("utr_reference"), // 12-digit UPI reference number entered by admin
  adminNotes: text("admin_notes"),
  requestedAt: integer("requested_at", { mode: "timestamp" }).notNull(),
  processedAt: integer("processed_at", { mode: "timestamp" }),
}, (t) => [
  index("payout_user_idx").on(t.userId),
  index("payout_status_idx").on(t.status),
  index("payout_upi_idx").on(t.upiId),
]);
