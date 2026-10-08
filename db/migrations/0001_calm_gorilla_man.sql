CREATE TABLE `post` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`cover_image` text,
	`published` integer DEFAULT false NOT NULL,
	`author_id` text,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `post_slug_unique` ON `post` (`slug`);--> statement-breakpoint
CREATE INDEX `post_slug_idx` ON `post` (`slug`);--> statement-breakpoint
CREATE INDEX `post_published_idx` ON `post` (`published`);--> statement-breakpoint
ALTER TABLE `user` ADD `role` text DEFAULT 'user' NOT NULL;