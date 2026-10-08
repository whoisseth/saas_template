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

export async function getAllPosts(): Promise<Post[]> {
  try {
    const rawDbPosts = await repos.blog.listPublished();
    return rawDbPosts.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description ?? undefined,
      publishedAt: (p.publishedAt ?? p.createdAt).toISOString(),
      updatedAt: p.updatedAt.toISOString(),
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
      publishedAt: (dbPost.publishedAt ?? dbPost.createdAt).toISOString(),
      updatedAt: dbPost.updatedAt.toISOString(),
      coverImage: dbPost.coverImage ?? undefined,
      content: dbPost.content,
    };
  } catch (err) {
    console.error("Error fetching blog post by slug from D1:", err);
    return null;
  }
}
