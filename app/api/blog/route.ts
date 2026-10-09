import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { repos } from "@/db/repo/d1";
import { canManageBlog, resolveUser } from "@/lib/admin";
import { postInputSchema } from "@/lib/blog-schema";

export async function GET() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  const user = await resolveUser(session?.user);
  const userCanManage = user ? canManageBlog(user) : false;

  if (userCanManage) {
    const posts = await repos.blog.listAll();
    return Response.json({ posts });
  }

  const posts = await repos.blog.listPublished();
  return Response.json({ posts });
}

export async function POST(req: Request) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const user = await resolveUser(session.user);
  if (!canManageBlog(user)) {
    return new Response(JSON.stringify({ error: "Forbidden: Editors and Admins only" }), { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const parsed = postInputSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.format() }), { status: 400 });
  }

  const existing = await repos.blog.findBySlug(parsed.data.slug);
  if (existing) {
    return new Response(JSON.stringify({ error: "A post with this slug already exists" }), { status: 409 });
  }

  const now = new Date();
  const newPost = await repos.blog.create({
    id: crypto.randomUUID(),
    title: parsed.data.title,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    content: parsed.data.content,
    coverImage: parsed.data.coverImage || null,
    published: parsed.data.published,
    authorId: session.user.id,
    publishedAt: parsed.data.published ? now : null,
    createdAt: now,
    updatedAt: now,
  });

  return Response.json({ post: newPost }, { status: 201 });
}
