import { z } from "zod";

export const postInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(500).optional(),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().url("Must be a valid URL").or(z.string().startsWith("/api/assets/")).optional().or(z.literal("")),
  published: z.boolean().default(false),
});

export const postUpdateSchema = postInputSchema.partial();
