#!/usr/bin/env node
/**
 * Pulls HatWear's inventory from Clover before each build and saves the raw
 * data to src/data/clover-raw.generated.json, which the site maps to products.
 *
 * - Without CLOVER_MERCHANT_ID + CLOVER_API_TOKEN it writes `null`, and the
 *   site keeps its sample catalog (preview mode).
 * - With them, a failed sync stops the build, so a broken connection can never
 *   replace the real catalog with the sample one in production.
 *
 * Runs automatically via `npm run build` / `npm run dev` (prebuild / predev).
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "clover-raw.generated.json");
const env = process.env.CLOVER_ENV === "production" ? "production" : "sandbox";
const base = process.env.CLOVER_REST_BASE || (env === "production" ? "https://api.clover.com" : "https://apisandbox.dev.clover.com");
const mId = process.env.CLOVER_MERCHANT_ID;
const token = process.env.CLOVER_API_TOKEN;
const onlineCategory = (process.env.CLOVER_ONLINE_CATEGORY || "").trim().toLowerCase();

function write(data) {
  writeFileSync(OUT, JSON.stringify(data) + "\n");
}

if (!mId || !token) {
  write(null);
  console.log("[clover] Not configured: using the sample catalog.");
  process.exit(0);
}

async function get(p) {
  const res = await fetch(`${base}/v3/merchants/${mId}${p}`, {
    headers: { accept: "application/json", authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`GET ${p} → ${res.status} ${await res.text().catch(() => "")}`.slice(0, 300));
  return res.json();
}

async function all(p) {
  const limit = 1000;
  const out = [];
  for (let offset = 0; offset < 50_000; offset += limit) {
    const sep = p.includes("?") ? "&" : "?";
    const page = await get(`${p}${sep}limit=${limit}&offset=${offset}`);
    const els = page.elements ?? [];
    out.push(...els);
    if (els.length < limit) break;
  }
  return out;
}

try {
  const [items, attributes] = await Promise.all([
    all("/items?expand=itemStock,categories,itemGroup,options,tags"),
    all("/attributes?expand=options"),
  ]);
  const visible = items.filter((it) => {
    if (it.hidden) return false;
    if (!onlineCategory) return true;
    return (it.categories?.elements ?? []).some((c) => (c.name || "").trim().toLowerCase() === onlineCategory);
  });
  write({
    fetchedAt: new Date().toISOString(),
    onlineCategory: onlineCategory || null,
    items: visible,
    attributes,
  });
  console.log(`[clover] Synced ${visible.length} of ${items.length} items${onlineCategory ? ` (category "${onlineCategory}")` : ""}.`);
} catch (err) {
  console.error(`[clover] Inventory sync failed: ${err.message}`);
  process.exit(1);
}
