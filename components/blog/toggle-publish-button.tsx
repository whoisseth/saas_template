"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface TogglePublishButtonProps {
  postId: string;
  published: boolean;
}

export function TogglePublishButton({ postId, published }: TogglePublishButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/blog/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition hover:opacity-80 disabled:opacity-50 ${
        published
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
      }`}
      title={published ? "Click to unpublish (switch to draft)" : "Click to publish (make live)"}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <span>{published ? "Published (Live)" : "Draft (Click to Publish)"}</span>
      )}
    </button>
  );
}
