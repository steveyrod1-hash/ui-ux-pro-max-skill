import { readArtwork } from "@/lib/requests-store";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";

/** Customer artwork, only for the store owner (ADMIN_TOKEN). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(new URL(req.url).searchParams.get("token")))) return new Response("Not found", { status: 404 });
  const { id } = await params;
  const art = await readArtwork(id);
  if (!art) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(art.bytes), {
    headers: {
      "content-type": art.type,
      "cache-control": "private, no-store",
      "content-security-policy": "default-src 'none'",
      "x-content-type-options": "nosniff",
    },
  });
}
