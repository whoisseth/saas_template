import { headers } from "next/headers";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { canManageUsers, resolveUser } from "@/lib/admin";
import { repos } from "@/db/repo/d1";

const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["admin", "editor", "user"]),
});

export async function GET() {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await resolveUser(session.user);
  if (!canManageUsers(user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const allUsers = await repos.users.list();
  const sanitized = allUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || "user",
    createdAt: u.createdAt,
    image: u.image,
  }));

  return Response.json({ users: sanitized });
}

export async function PATCH(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await resolveUser(session.user);
  if (!canManageUsers(user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateRoleSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request payload", details: parsed.error.issues }, { status: 400 });
  }

  const { userId, role } = parsed.data;

  // Prevent admin from demoting themselves and locking themselves out
  if (userId === session.user.id && role !== "admin") {
    return Response.json({ error: "You cannot remove your own admin access" }, { status: 400 });
  }

  const targetUser = await repos.users.findById(userId);
  if (!targetUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  await repos.users.updateRole(userId, role);

  return Response.json({ ok: true, userId, role });
}
