import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { repos } from "@/db/repo/d1";
import { isAdmin } from "@/lib/admin";
import { postUpdateSchema } from "@/lib/blog-schema";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const post = await repos.blog.findById(id);

  if (!post) {
    return new Response(JSON.stringify({ error: "Post not found" }), { status: 404 });
  }

  const session = await getAuth().api.getSession({ headers: await headers() });
  const userIsAdmin = session ? isAdmin(session.user) : false;

  if (!post.published && !userIsAdmin) {
    return new Response(JSON.stringify({ error: "Post not found" }), { status: 404 });
  }

  return Response.json({ post });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  if (!isAdmin(session.user)) {
    return new Response(JSON.stringify({ error: "Forbidden: Admins only" }), { status: 403 });
  }

  const { id } = await params;
  const existing = await repos.blog.findById(id);
  if (!existing) {
    return new Response(JSON.stringify({ error: "Post not found" }), { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const parsed = postUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.format() }), { status: 400 });
  }

  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    const slugConflict = await repos.blog.findBySlug(parsed.data.slug);
    if (slugConflict) {
      return new Response(JSON.stringify({ error: "A post with this slug already exists" }), { status: 409 });
    }
  }

  const updateData: Parameters<typeof repos.blog.update>[1] = {
    ...parsed.data,
  };

  // If publishing for the first time, set publishedAt
  if (parsed.data.published === true && !existing.publishedAt) {
    updateData.publishedAt = new Date();
  }

  const updated = await repos.blog.update(id, updateData);
  return Response.json({ post: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  if (!isAdmin(session.user)) {
    return new Response(JSON.stringify({ error: "Forbidden: Admins only" }), { status: 403 });
  }

  const { id } = await params;
  const existing = await repos.blog.findById(id);
  if (!existing) {
    return new Response(JSON.stringify({ error: "Post not found" }), { status: 404 });
  }

  await repos.blog.delete(id);
  return Response.json({ success: true });
}
