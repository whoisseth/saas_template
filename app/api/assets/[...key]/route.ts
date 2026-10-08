import { cfEnv } from "@/lib/cf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const fullKey = key.join("/");

  try {
    const { UPLOADS } = cfEnv();
    const object = await UPLOADS.get(fullKey);

    if (!object) {
      return new Response("Not found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(object.body, { headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
