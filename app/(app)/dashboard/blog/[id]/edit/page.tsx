import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { repos } from "@/db/repo/d1";
import { isAdmin } from "@/lib/admin";
import { BlogPostForm } from "@/components/blog/blog-post-form";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session || !isAdmin(session.user)) {
    redirect("/dashboard/blog");
  }

  const { id } = await params;
  const post = await repos.blog.findById(id);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Blog Post</h1>
        <p className="text-sm text-muted-foreground">
          Update article content, metadata, cover image, and publishing status.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <BlogPostForm
          initialData={{
            id: post.id,
            title: post.title,
            slug: post.slug,
            description: post.description,
            content: post.content,
            coverImage: post.coverImage,
            published: post.published,
          }}
        />
      </div>
    </div>
  );
}
