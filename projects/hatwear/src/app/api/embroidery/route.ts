import { NextResponse } from "next/server";
import { LIMITS, labelFor, validateContact, validateDesign, type EmbroideryRequest } from "@/lib/embroidery";
import { markForwarded, newRequestId, saveRequest, type StoredRequest } from "@/lib/requests-store";
import { site } from "@/content/site";

export const runtime = "nodejs";

// Small in-memory rate limit: 5 requests per IP per 10 minutes (per server instance).
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

/** Check real file contents, not just the declared type. */
function sniff(bytes: Uint8Array): { type: string; ext: string } | null {
  const b = bytes;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { type: "image/png", ext: "png" };
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { type: "image/jpeg", ext: "jpg" };
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50)
    return { type: "image/webp", ext: "webp" };
  return null;
}

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (limited(ip)) {
    return NextResponse.json({ message: `Too many requests from this connection. Please wait a few minutes or call ${site.phone.display}.` }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ message: "The request could not be read." }, { status: 400 });
  }

  // Bots fill the hidden field; people never see it. Pretend success so they move on.
  if (str(form.get("company_website"))) return NextResponse.json({ id: "HW-000000-OK0" });

  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(String(form.get("payload") ?? "{}"));
  } catch {
    return NextResponse.json({ message: "The request could not be read." }, { status: 400 });
  }

  const artwork = form.get("artwork");
  const file = artwork instanceof File && artwork.size > 0 ? artwork : null;

  const r: EmbroideryRequest = {
    baseType: str(raw.baseType, 20) as EmbroideryRequest["baseType"],
    baseColor: str(raw.baseColor, 40),
    ownItem: str(raw.ownItem, 120),
    text: str(raw.text, LIMITS.textMax),
    font: str(raw.font, 20),
    placement: str(raw.placement, 20) as EmbroideryRequest["placement"],
    thread: str(raw.thread, 20),
    quantity: Number(raw.quantity),
    notes: str(raw.notes, LIMITS.notesMax),
    name: str(raw.name, 120),
    email: str(raw.email, 200),
    phone: str(raw.phone, 40),
    contactMethod: (["email", "phone", "text"].includes(String(raw.contactMethod)) ? raw.contactMethod : "email") as EmbroideryRequest["contactMethod"],
    neededBy: /^\d{4}-\d{2}-\d{2}$/.test(String(raw.neededBy ?? "")) ? String(raw.neededBy) : "",
    hasArtwork: !!file,
  };

  const errors = { ...validateDesign(r), ...validateContact(r) };
  let bytes: Uint8Array | undefined;
  let kind: { type: string; ext: string } | null = null;
  if (file) {
    if (file.size > LIMITS.fileMaxBytes) errors.artwork = "Artwork must be 8 MB or smaller.";
    else {
      bytes = new Uint8Array(await file.arrayBuffer());
      kind = sniff(bytes);
      if (!kind) errors.artwork = "Artwork must be a PNG, JPG or WebP image.";
    }
  }
  if (Object.keys(errors).length) {
    return NextResponse.json({ message: "Some details need fixing.", errors }, { status: 422 });
  }

  const id = newRequestId();
  const rec: StoredRequest = {
    id,
    receivedAt: new Date().toISOString(),
    request: r,
    artwork: file && kind ? { file: `artwork.${kind.ext}`, type: kind.type, bytes: file.size, originalName: str(file.name, 120) } : undefined,
    forwarded: false,
  };

  let saved = false;
  try {
    await saveRequest(rec, bytes && kind ? { bytes, ext: kind.ext } : undefined);
    saved = true;
  } catch (e) {
    console.error("[embroidery] could not save request locally", e);
  }

  // Forward to the owner's channel (Slack, Zapier, Make, email service...).
  let forwarded = false;
  const hook = process.env.EMBROIDERY_WEBHOOK_URL;
  if (hook) {
    const l = labelFor(r);
    const text = [
      `New embroidery request ${id}`,
      `${r.name} · ${r.phone || "no phone"} · ${r.email || "no email"} · prefers ${r.contactMethod}`,
      `${l.item} · ${r.quantity} pc`,
      `${r.text ? `Text "${r.text}" (${l.font})` : "No text"} · ${l.placement} · ${l.thread} thread${rec.artwork ? " · artwork attached" : ""}`,
      r.neededBy ? `Needed by ${r.neededBy}` : "",
      r.notes ? `Notes: ${r.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      const res = await fetch(hook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, request: { id, receivedAt: rec.receivedAt, ...r, artwork: rec.artwork ? `${site.url}/api/embroidery/artwork/${id}` : null } }),
        signal: AbortSignal.timeout(8000),
      });
      forwarded = res.ok;
      if (forwarded && saved) await markForwarded(rec).catch(() => {});
    } catch (e) {
      console.error("[embroidery] webhook failed", e);
    }
  }

  if (!saved && !forwarded) {
    return NextResponse.json({ message: `We couldn't record your request right now. Please call ${site.phone.display}.` }, { status: 503 });
  }
  return NextResponse.json({ id });
}
