import { headers } from "next/headers";
import Link from "next/link";
import { getAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "./sign-out-button";
import { isAdmin } from "@/lib/admin";

export default async function DashboardPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  const user = session?.user;
  const userIsAdmin = user ? isAdmin(user) : false;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <SignOutButton />
      </div>
      <p className="mt-4 text-muted-foreground">Hello {user?.name ?? user?.email}.</p>
      
      <div className="mt-6 flex flex-wrap gap-3">
        <form action="/api/stripe/portal" method="POST">
          <Button type="submit">Manage billing</Button>
        </form>

        {userIsAdmin && (
          <Link href="/dashboard/blog">
            <Button variant="outline">Manage Blog</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
