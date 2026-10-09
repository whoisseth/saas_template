import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { canManageBlog, resolveUser } from "@/lib/admin";
import { BlogPostForm } from "@/components/blog/blog-post-form";

export default async function NewPostPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  const user = await resolveUser(session?.user);
  if (!user || !canManageBlog(user)) {
    redirect("/dashboard/blog");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Blog Post</h1>
        <p className="text-sm text-muted-foreground">
          Write your article using the Tiptap visual editor, attach images, and publish.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <BlogPostForm />
      </div>
    </div>
  );
}
