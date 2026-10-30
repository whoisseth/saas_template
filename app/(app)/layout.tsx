import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const session = await getAuth().api.getSession({ headers: h });
  if (!session) redirect("/sign-in");
  return (
    <div className="min-h-screen pb-20 sm:pb-8">
      {children}
      <MobileBottomNav />
    </div>
  );
}
