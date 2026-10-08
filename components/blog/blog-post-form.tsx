"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TiptapEditor } from "./tiptap-editor";
import { CoverImageUploader } from "./cover-image-uploader";
import { Loader2, ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";

interface BlogPostFormProps {
  initialData?: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    content: string;
    coverImage?: string | null;
    published: boolean;
  };
}

export function BlogPostForm({ initialData }: BlogPostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [coverImage, setCoverImage] = useState(initialData?.coverImage ?? "");
  const [published, setPublished] = useState(initialData?.published ?? false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto slug generator from title if slug not manually edited
  function handleTitleChange(val: string) {
    setTitle(val);
    if (!initialData) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generatedSlug);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        content: content.trim(),
        coverImage: coverImage || undefined,
        published,
      };

      const url = initialData ? `/api/blog/${initialData.id}` : "/api/blog";
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { error?: string | Record<string, unknown> };

      if (!res.ok) {
        if (typeof data.error === "string") {
          throw new Error(data.error);
        } else {
          throw new Error("Validation error. Please verify title and slug.");
        }
      }

      router.push("/dashboard/blog");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save post");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/blog"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to posts</span>
        </Link>

        <div className="flex items-center gap-3">
          {initialData?.published && (
            <Link
              href={`/blog/${initialData.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>View live</span>
            </Link>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{initialData ? "Save Changes" : "Create Post"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Main Fields */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Post Title</label>
          <input
            type="text"
            required
            placeholder="e.g. 10 Best Practices for Building SaaS in 2026"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="mt-1 h-11 w-full rounded-md border bg-background px-3 text-base font-medium focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Slug (URL Path)</label>
            <div className="mt-1 flex items-center rounded-md border bg-background px-3 focus-within:ring-1 focus-within:ring-primary">
              <span className="text-xs text-muted-foreground">/blog/</span>
              <input
                type="text"
                required
                placeholder="10-best-practices"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="h-9 w-full bg-transparent text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Status</label>
            <div className="mt-1 flex h-9 items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-xs font-medium">
                  {published ? "Published (Visible to all)" : "Draft (Hidden from public)"}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Short Description / Excerpt</label>
          <textarea
            rows={2}
            placeholder="A brief summary shown in search results and social cards..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Cover Image */}
        <CoverImageUploader value={coverImage} onChange={setCoverImage} />

        {/* Content Body */}
        <div className="space-y-1.5 pt-2">
          <label className="text-sm font-medium">Article Content (WYSIWYG Editor)</label>
          <TiptapEditor content={content} onChange={setContent} />
        </div>
      </div>
    </form>
  );
}
