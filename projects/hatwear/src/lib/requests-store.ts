import "server-only";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EmbroideryRequest } from "./embroidery";

/**
 * Local request storage: one folder per request under .data/embroidery-requests.
 * Good for development and single-server hosting. On serverless hosting the
 * filesystem is temporary, so set EMBROIDERY_WEBHOOK_URL (or swap this module
 * for a database or object store) before going live.
 */
const ROOT = path.join(process.cwd(), ".data", "embroidery-requests");

export interface StoredRequest {
  id: string;
  receivedAt: string;
  request: EmbroideryRequest;
  artwork?: { file: string; type: string; bytes: number; originalName: string };
  forwarded: boolean;
}

export function newRequestId() {
  const d = new Date();
  const ymd = `${d.getFullYear() % 100}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(3)), (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");
  return `HW-${ymd}-${rand}`;
}

const safeId = (id: string) => /^HW-\d{6}-[A-Z0-9]{3}$/.test(id);

export async function saveRequest(rec: StoredRequest, artwork?: { bytes: Uint8Array; ext: string }) {
  const dir = path.join(ROOT, rec.id);
  await mkdir(dir, { recursive: true });
  if (artwork && rec.artwork) await writeFile(path.join(dir, rec.artwork.file), artwork.bytes);
  await writeFile(path.join(dir, "request.json"), JSON.stringify(rec, null, 2));
}

export async function markForwarded(rec: StoredRequest) {
  await writeFile(path.join(ROOT, rec.id, "request.json"), JSON.stringify({ ...rec, forwarded: true }, null, 2));
}

export async function listRequests(): Promise<StoredRequest[]> {
  try {
    const ids = (await readdir(ROOT)).filter(safeId);
    const all = await Promise.all(
      ids.map(async (id) => {
        try {
          return JSON.parse(await readFile(path.join(ROOT, id, "request.json"), "utf8")) as StoredRequest;
        } catch {
          return null;
        }
      }),
    );
    return all.filter((x): x is StoredRequest => !!x).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  } catch {
    return [];
  }
}

export async function readArtwork(id: string): Promise<{ bytes: Buffer; type: string } | null> {
  if (!safeId(id)) return null;
  try {
    const rec = JSON.parse(await readFile(path.join(ROOT, id, "request.json"), "utf8")) as StoredRequest;
    if (!rec.artwork) return null;
    return { bytes: await readFile(path.join(ROOT, id, rec.artwork.file)), type: rec.artwork.type };
  } catch {
    return null;
  }
}
