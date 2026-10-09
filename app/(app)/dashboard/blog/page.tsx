import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { repos } from "@/db/repo/d1";
import { canManageBlog, resolveUser } from "@/lib/admin";
import Link from "next/link";
import { Plus, Edit, Eye, ShieldAlert } from "lucide-react";
import { DeletePostButton } from "@/components/blog/delete-post-button";
import { TogglePublishButton } from "@/components/blog/toggle-publish-button";
import { formatDate } from "@/lib/utils";

export default async function BlogAdminPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  const user = await resolveUser(session?.user);
  const hasAccess = user ? canManageBlog(user) : false;

  if (!hasAccess) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Access Restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only administrators and editors can access the blog management system.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const posts = await repos.blog.listAll();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-sm text-muted-foreground">
            Manage your articles, upload images, and publish to the public blog.
          </p>
        </div>

        <Link
          href="/dashboard/blog/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          <span>New Post</span>
        </Link>
      </div>

      <div className="mt-8 rounded-lg border bg-card">
        {posts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">No posts created yet.</p>
            <Link
              href="/dashboard/blog/new"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary underline"
            >
              Create your first post
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {posts.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  {p.coverImage ? (
                    <img
                      src={p.coverImage}
                      alt={p.title}
                      className="h-12 w-16 rounded object-cover border"
                    />
                  ) : (
                    <div className="h-12 w-16 rounded border bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                      No cover
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium text-sm text-foreground">{p.title}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <TogglePublishButton postId={p.id} published={p.published} />
                      <span>•</span>
                      <span>/blog/{p.slug}</span>
                      <span>•</span>
                      <span>{formatDate(p.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {p.published && (
                    <Link
                      href={`/blog/${p.slug}`}
                      target="_blank"
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="View live post"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  )}
                  <Link
                    href={`/dashboard/blog/${p.id}/edit`}
                    className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Edit post"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <DeletePostButton postId={p.id} postTitle={p.title} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
