"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Link as LinkIcon, Image as ImageIcon } from "lucide-react";

interface CoverImageUploaderProps {
  value?: string | null;
  onChange: (url: string) => void;
}

export function CoverImageUploader({ value, onChange }: CoverImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Upload failed");
      }

      onChange(data.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleSetUrl() {
    if (!urlInput.trim()) return;
    onChange(urlInput.trim());
    setShowUrlInput(false);
    setUrlInput("");
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Cover Image</label>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {value ? (
        <div className="relative overflow-hidden rounded-lg border bg-muted">
          <img
            src={value}
            alt="Cover preview"
            className="h-48 w-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-foreground shadow-sm backdrop-blur-sm transition hover:bg-destructive hover:text-destructive-foreground"
            title="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6">
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                id="cover-upload"
                disabled={uploading}
              />
              <label
                htmlFor="cover-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload to Cloudflare R2</span>
                  </>
                )}
              </label>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                <span>Paste Image URL</span>
              </button>
            </div>

            {showUrlInput && (
              <div className="mt-2 flex w-full max-w-sm items-center gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="h-8 w-full rounded-md border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleSetUrl}
                  className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80"
                >
                  Set
                </button>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              Supports JPG, PNG, WebP, GIF, SVG (up to 5MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
