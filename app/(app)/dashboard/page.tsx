import { headers } from "next/headers";
import Link from "next/link";
import { getAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "./sign-out-button";
import { canManageBlog, canManageUsers, resolveUser } from "@/lib/admin";
import { Users, FileText } from "lucide-react";

export default async function DashboardPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  const user = await resolveUser(session?.user);
  const hasBlogAccess = user ? canManageBlog(user) : false;
  const hasUsersAccess = user ? canManageUsers(user) : false;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Hello {user?.name ?? user?.email}.</p>
            {user?.role && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  user.role === "admin"
                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    : user.role === "editor"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {user.role === "admin" ? "Admin" : user.role === "editor" ? "Editor" : "User"}
              </span>
            )}
          </div>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <form action="/api/stripe/portal" method="POST">
          <Button type="submit">Manage billing</Button>
        </form>

        {hasBlogAccess && (
          <Link href="/dashboard/blog">
            <Button variant="outline" className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              Manage Blog
            </Button>
          </Link>
        )}

        {hasUsersAccess && (
          <Link href="/dashboard/users">
            <Button variant="outline" className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Team & Roles
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
