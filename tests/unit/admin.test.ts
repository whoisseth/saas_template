import { describe, it, expect, vi } from "vitest";
import { isAdmin, canManageBlog, canManageUsers, resolveUser } from "@/lib/admin";
import { repos } from "@/db/repo/d1";

describe("admin authorization", () => {
  it("returns true when user has admin role", () => {
    expect(isAdmin({ role: "admin" })).toBe(true);
  });

  it("returns false when user has user role or no role", () => {
    expect(isAdmin({ role: "user" })).toBe(false);
    expect(isAdmin({ role: null })).toBe(false);
    expect(isAdmin({})).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it("canManageBlog allows both admin and editor", () => {
    expect(canManageBlog({ role: "admin" })).toBe(true);
    expect(canManageBlog({ role: "editor" })).toBe(true);
    expect(canManageBlog({ role: "user" })).toBe(false);
    expect(canManageBlog(null)).toBe(false);
  });

  it("canManageUsers allows only admin", () => {
    expect(canManageUsers({ role: "admin" })).toBe(true);
    expect(canManageUsers({ role: "editor" })).toBe(false);
    expect(canManageUsers({ role: "user" })).toBe(false);
    expect(canManageUsers(null)).toBe(false);
  });

  it("resolveUser returns null for empty user", async () => {
    expect(await resolveUser(null)).toBe(null);
    expect(await resolveUser(undefined)).toBe(null);
  });

  it("resolveUser returns input if no user id", async () => {
    const user = { email: "test@example.com", role: "editor" };
    expect(await resolveUser(user)).toEqual(user);
  });

  it("resolveUser hydrates fresh role from database", async () => {
    vi.spyOn(repos.users, "findById").mockResolvedValueOnce({
      id: "u123",
      email: "editor@example.com",
      role: "editor",
      name: "Editor User",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      twoFactorEnabled: false,
      stripeCustomerId: null,
      deletedAt: null,
    });

    const resolved = await resolveUser({ id: "u123", role: "user", email: "editor@example.com" });
    expect(resolved?.role).toBe("editor");
    expect(canManageBlog(resolved)).toBe(true);
  });
});
