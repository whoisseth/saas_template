import { headers } from "next/headers";
import Link from "next/link";
import { getAuth } from "@/lib/auth";
import { repos } from "@/db/repo/d1";
import { canManageUsers, resolveUser } from "@/lib/admin";
import { UserRoleTable, SerializedUser } from "@/components/admin/user-role-table";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default async function AdminUsersPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  const user = await resolveUser(session?.user);
  if (!session || !user || !canManageUsers(user)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Admin Access Required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only administrators can access team roles and user permissions.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const rawUsers = await repos.users.list();
  const serializedUsers: SerializedUser[] = rawUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || "user",
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : (u.createdAt as string | null),
    image: u.image,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Team & Role Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage member roles and permissions across your platform.
            </p>
          </div>
        </div>
      </div>

      <UserRoleTable
        initialUsers={serializedUsers}
        currentUserId={session.user.id}
      />
    </div>
  );
}
