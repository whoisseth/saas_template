import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { cfEnv } from "@/lib/cf";
import { isAdmin } from "@/lib/admin";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export async function POST(req: Request) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  if (!isAdmin(session.user)) {
    return new Response(JSON.stringify({ error: "Forbidden: Admins only" }), { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return new Response(
      JSON.stringify({ error: "Invalid file type. Only JPG, PNG, WEBP, GIF, and SVG are allowed." }),
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return new Response(
      JSON.stringify({ error: "File exceeds 5MB size limit." }),
      { status: 400 },
    );
  }

  const ext = EXTENSION_MAP[file.type] || "bin";
  const key = `blog-images/${crypto.randomUUID()}.${ext}`;

  try {
    const { UPLOADS } = cfEnv();
    const buffer = await file.arrayBuffer();
    await UPLOADS.put(key, buffer, {
      httpMetadata: { contentType: file.type },
    });

    const url = `/api/assets/${key}`;
    return Response.json({ url });
  } catch (err) {
    console.error("R2 Upload failed:", err);
    return new Response(JSON.stringify({ error: "Upload failed" }), { status: 500 });
  }
}
