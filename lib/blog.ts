import { repos } from "@/db/repo/d1";

export type Post = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  publishedAt: string;
  updatedAt: string;
  author?: string;
  coverImage?: string;
  content: string;
};

function toSafeIsoString(date: Date): string {
  if (date.getFullYear() > 3000) {
    return new Date(date.getTime() / 1000).toISOString();
  }
  return date.toISOString();
}

export async function getAllPosts(): Promise<Post[]> {
  try {
    const rawDbPosts = await repos.blog.listPublished();
    return rawDbPosts.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description ?? undefined,
      publishedAt: toSafeIsoString(p.publishedAt ?? p.createdAt),
      updatedAt: toSafeIsoString(p.updatedAt),
      coverImage: p.coverImage ?? undefined,
      content: p.content,
    }));
  } catch (err) {
    console.error("Error fetching blog posts from D1:", err);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const dbPost = await repos.blog.findBySlug(slug);
    if (!dbPost || !dbPost.published) return null;

    return {
      id: dbPost.id,
      slug: dbPost.slug,
      title: dbPost.title,
      description: dbPost.description ?? undefined,
      publishedAt: toSafeIsoString(dbPost.publishedAt ?? dbPost.createdAt),
      updatedAt: toSafeIsoString(dbPost.updatedAt),
      coverImage: dbPost.coverImage ?? undefined,
      content: dbPost.content,
    };
  } catch (err) {
    console.error("Error fetching blog post by slug from D1:", err);
    return null;
  }
}
