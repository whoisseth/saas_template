import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const post = sqliteTable("post", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
}, (t) => [
  index("post_slug_idx").on(t.slug),
  index("post_published_idx").on(t.published),
]);
