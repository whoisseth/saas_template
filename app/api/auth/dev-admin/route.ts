import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, session } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const isPreview = process.env.NEXT_PUBLIC_IS_PREVIEW === "true" || process.env.NODE_ENV === "development";
  if (!isPreview) {
    return NextResponse.json({ error: "Only available in preview/development" }, { status: 403 });
  }

  const d = db();
  const adminEmail = (process.env.ADMIN_EMAILS || "utkarshseth2019@gmail.com").split(",")[0].trim().toLowerCase();

  const adminUser = await d.query.user.findFirst({
    where: eq(user.email, adminEmail),
  });

  const userId = adminUser ? adminUser.id : crypto.randomUUID();

  if (!adminUser) {
    await d.insert(user).values({
      id: userId,
      email: adminEmail,
      name: "Utkarsh Seth (Admin)",
      role: "admin",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await d.insert(session).values({
    id: crypto.randomUUID(),
    userId,
    token,
    expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const url = new URL("/admin", req.url);
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.set("better-auth.session_token", token, {
    httpOnly: true,
    secure: false,
    path: "/",
    expires: expiresAt,
    sameSite: "lax",
  });

  return res;
}
