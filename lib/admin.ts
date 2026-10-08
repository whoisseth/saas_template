export interface UserWithRole {
  role?: string | null;
  [key: string]: unknown;
}

export function isAdmin(user?: UserWithRole | null): boolean {
  if (!user) return false;
  return user.role === "admin";
}
