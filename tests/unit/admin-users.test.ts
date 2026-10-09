import { describe, it, expect } from "vitest";
import { z } from "zod";

const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["admin", "editor", "user"]),
});

describe("admin user management validation", () => {
  it("accepts valid roles: admin, editor, user", () => {
    expect(updateRoleSchema.safeParse({ userId: "u1", role: "admin" }).success).toBe(true);
    expect(updateRoleSchema.safeParse({ userId: "u1", role: "editor" }).success).toBe(true);
    expect(updateRoleSchema.safeParse({ userId: "u1", role: "user" }).success).toBe(true);
  });

  it("rejects invalid roles or missing userId", () => {
    expect(updateRoleSchema.safeParse({ userId: "u1", role: "superhero" }).success).toBe(false);
    expect(updateRoleSchema.safeParse({ userId: "", role: "editor" }).success).toBe(false);
    expect(updateRoleSchema.safeParse({ role: "admin" }).success).toBe(false);
  });
});
