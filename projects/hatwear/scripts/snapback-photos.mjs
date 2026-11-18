// Reports which Classic Snapback photos are in place and which are missing,
// and rewrites docs/classic-snapbacks/photo-status.csv.
//   npm run photos:status
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const { hats } = JSON.parse(fs.readFileSync(path.join(root, "src/data/classic-snapbacks.json"), "utf8"));
const VIEWS = ["front", "back", "inside", "side"];
const EXT = ["webp", "jpg", "jpeg", "png", "avif"];
const find = (h, v) => EXT.map((e) => `assets/hats/${h.league.toLowerCase()}/${h.slug}/${v}.${e}`).find((rel) => fs.existsSync(path.join(root, "public", rel)));

const rows = [["league", "team", "view", "expected_path", "present"]];
let have = 0;
const complete = [];
const partial = [];
for (const h of hats) {
  const got = VIEWS.filter((v) => {
    const f = find(h, v);
    rows.push([h.league, h.team, v, `/assets/hats/${h.league.toLowerCase()}/${h.slug}/${v}.webp`, f ? "YES" : "NO"]);
    return !!f;
  });
  have += got.length;
  if (got.length === 4) complete.push(h.team);
  else if (got.length) partial.push(`${h.team} (missing ${VIEWS.filter((v) => !got.includes(v)).join(", ")})`);
}
const csv = rows.map((r) => r.map((c) => (/[",]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\n") + "\n";
fs.writeFileSync(path.join(root, "docs/classic-snapbacks/photo-status.csv"), csv);
const mlb = hats.filter((h) => h.league === "MLB").length;
console.log(`Teams: ${hats.length} (MLB ${mlb}, NFL ${hats.length - mlb})`);
console.log(`Photos: ${have} of ${hats.length * 4}`);
console.log(`Complete (4/4): ${complete.length}${complete.length ? " — " + complete.join(", ") : ""}`);
console.log(`Partial: ${partial.length}${partial.length ? "\n  " + partial.join("\n  ") : ""}`);
console.log(`No photos yet: ${hats.length - complete.length - partial.length}`);
