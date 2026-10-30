CREATE TABLE `clicks` (
	`id` text PRIMARY KEY NOT NULL,
	`sub_id` text NOT NULL,
	`user_id` text,
	`store_id` text,
	`deal_id` text,
	`original_url` text NOT NULL,
	`affiliate_url` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clicks_sub_id_unique` ON `clicks` (`sub_id`);--> statement-breakpoint
CREATE INDEX `clicks_user_idx` ON `clicks` (`user_id`);--> statement-breakpoint
CREATE INDEX `clicks_sub_idx` ON `clicks` (`sub_id`);--> statement-breakpoint
CREATE TABLE `deals` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`original_price` real NOT NULL,
	`discounted_price` real NOT NULL,
	`discount_percent` integer NOT NULL,
	`image_url` text NOT NULL,
	`target_url` text NOT NULL,
	`cashback_estimate` text,
	`category` text DEFAULT 'Electronics' NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`clicks_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deals_slug_unique` ON `deals` (`slug`);--> statement-breakpoint
CREATE INDEX `deals_store_idx` ON `deals` (`store_id`);--> statement-breakpoint
CREATE INDEX `deals_featured_idx` ON `deals` (`is_featured`);--> statement-breakpoint
CREATE INDEX `deals_category_idx` ON `deals` (`category`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`sub_id` text NOT NULL,
	`user_id` text,
	`store_name` text NOT NULL,
	`order_amount` real DEFAULT 0 NOT NULL,
	`commission_amount` real DEFAULT 0 NOT NULL,
	`user_reward_amount` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'TRACKED' NOT NULL,
	`reconciled_at` integer,
	`expected_confirmation_date` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `orders_user_idx` ON `orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `orders_sub_idx` ON `orders` (`sub_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE TABLE `payout_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` real NOT NULL,
	`upi_id` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`utr_reference` text,
	`admin_notes` text,
	`requested_at` integer NOT NULL,
	`processed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `payout_user_idx` ON `payout_requests` (`user_id`);--> statement-breakpoint
CREATE INDEX `payout_status_idx` ON `payout_requests` (`status`);--> statement-breakpoint
CREATE INDEX `payout_upi_idx` ON `payout_requests` (`upi_id`);--> statement-breakpoint
CREATE TABLE `scratch_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`order_id` text,
	`reward_amount` real NOT NULL,
	`title` text DEFAULT 'Shopping Reward' NOT NULL,
	`is_revealed` integer DEFAULT false NOT NULL,
	`revealed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `scratch_user_idx` ON `scratch_cards` (`user_id`);--> statement-breakpoint
CREATE INDEX `scratch_revealed_idx` ON `scratch_cards` (`is_revealed`);--> statement-breakpoint
CREATE TABLE `stores` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo_url` text NOT NULL,
	`cashback_text` text NOT NULL,
	`affiliate_base_url` text NOT NULL,
	`description` text,
	`category` text DEFAULT 'General' NOT NULL,
	`is_featured` integer DEFAULT true NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stores_slug_unique` ON `stores` (`slug`);--> statement-breakpoint
CREATE TABLE `wallet_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`status` text DEFAULT 'CONFIRMED' NOT NULL,
	`reference_id` text,
	`description` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `wallet_user_idx` ON `wallet_ledger` (`user_id`);--> statement-breakpoint
CREATE INDEX `wallet_type_idx` ON `wallet_ledger` (`type`);