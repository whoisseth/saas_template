import { describe, it, expect } from "vitest";
import { isAdmin } from "@/lib/admin";

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
});
