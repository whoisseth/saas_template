import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog",
  description: "Articles and updates.",
};

export const dynamic = "force-dynamic";

export default async function BlogIndexPage() {
  const posts = await getAllPosts();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold">Blog</h1>
      {posts.length === 0 ? (
        <div className="mt-12 rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p className="text-base font-medium">No blog posts published yet.</p>
          <p className="mt-1 text-xs">Articles created in the dashboard will appear here once published.</p>
        </div>
      ) : (
        <ul className="mt-10 space-y-6">
          {posts.map((p) => (
            <li key={p.slug} className="border-b pb-6">
              <Link href={`/blog/${p.slug}`} className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold group-hover:underline">{p.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <time dateTime={p.publishedAt}>{formatDate(p.publishedAt)}</time>
                  </p>
                  {p.description && <p className="mt-2 text-muted-foreground text-sm line-clamp-2">{p.description}</p>}
                </div>
                {p.coverImage && (
                  <div className="shrink-0 overflow-hidden rounded-md border self-start sm:self-auto">
                    <img
                      src={p.coverImage}
                      alt={p.title}
                      className="h-24 w-36 object-cover transition group-hover:scale-105"
                    />
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
