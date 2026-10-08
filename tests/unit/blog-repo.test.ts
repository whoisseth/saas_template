import { describe, it, expect } from "vitest";
import type { BlogRepo, BlogPost, NewBlogPost } from "@/db/repo/index";

function makeInMemoryBlogRepo(): BlogRepo {
  const posts = new Map<string, BlogPost>();
  return {
    async findById(id) {
      return posts.get(id) ?? null;
    },
    async findBySlug(slug) {
      for (const p of posts.values()) {
        if (p.slug === slug) return p;
      }
      return null;
    },
    async listPublished() {
      return Array.from(posts.values())
        .filter((p) => p.published)
        .sort((a, b) => ((b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0)));
    },
    async listAll() {
      return Array.from(posts.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
    async create(data: NewBlogPost) {
      const p: BlogPost = {
        id: data.id ?? `post_${posts.size + 1}`,
        slug: data.slug,
        title: data.title,
        description: data.description ?? null,
        content: data.content,
        coverImage: data.coverImage ?? null,
        published: data.published ?? false,
        authorId: data.authorId ?? null,
        publishedAt: data.publishedAt ?? null,
        createdAt: data.createdAt ?? new Date(),
        updatedAt: data.updatedAt ?? new Date(),
      };
      posts.set(p.id, p);
      return p;
    },
    async update(id, data) {
      const existing = posts.get(id);
      if (!existing) return null;
      const updated: BlogPost = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };
      posts.set(id, updated);
      return updated;
    },
    async delete(id) {
      posts.delete(id);
    },
  };
}

describe("BlogRepo contract", () => {
  it("creates, finds, updates, and deletes a post", async () => {
    const repo = makeInMemoryBlogRepo();

    // Create
    const created = await repo.create({
      id: "p1",
      slug: "test-post",
      title: "Test Post",
      content: "<p>Hello</p>",
      published: true,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(created.slug).toBe("test-post");

    // Find by slug
    const found = await repo.findBySlug("test-post");
    expect(found?.title).toBe("Test Post");

    // Update
    const updated = await repo.update("p1", { title: "Updated Title" });
    expect(updated?.title).toBe("Updated Title");

    // List published
    const published = await repo.listPublished();
    expect(published).toHaveLength(1);

    // Delete
    await repo.delete("p1");
    const afterDelete = await repo.findById("p1");
    expect(afterDelete).toBeNull();
  });
});
