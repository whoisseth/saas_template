import { repos } from "@/db/repo/d1";

export type UserRole = "admin" | "editor" | "user";

export interface UserWithRole {
  id?: string;
  name?: string | null;
  role?: string | null;
  email?: string | null;
  [key: string]: unknown;
}

export async function resolveUser(
  user?: UserWithRole | null,
): Promise<UserWithRole | null> {
  if (!user) return null;
  if (!user.id) return user;

  try {
    const dbUser = await repos.users.findById(user.id);
    if (!dbUser) return user;
    return {
      ...user,
      ...dbUser,
      role: dbUser.role || user.role,
    };
  } catch {
    return user;
  }
}

export function isAdmin(user?: UserWithRole | null): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return typeof user.email === "string" && adminEmails.includes(user.email.toLowerCase());
}

export function canManageBlog(user?: UserWithRole | null): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return user.role === "editor";
}

export function canManageUsers(user?: UserWithRole | null): boolean {
  return isAdmin(user);
}

