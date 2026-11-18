/**
 * Classic Snapback collection: 59 team snapbacks (29 MLB, 30 NFL) from the
 * owner's handoff package (docs/classic-snapbacks/).
 *
 * Photos are found at build time. Drop a genuine photo of the exact hat at
 *   public/assets/hats/<mlb|nfl>/<team-slug>/<front|back|inside|side>.(webp|jpg|png)
 * and redeploy: it replaces that view's "photo coming soon" placeholder.
 * Only add photos you took yourself or have written permission to use.
 *
 * Server-only (reads the filesystem). Pages pass the result to client components.
 */
import fs from "node:fs";
import path from "node:path";
import data from "@/data/classic-snapbacks.json";

export type SnapLeague = "MLB" | "NFL";
export type SnapView = "front" | "back" | "inside" | "side";

export const SNAP_VIEWS: { id: SnapView; label: string; describe: string }[] = [
  { id: "front", label: "Front", describe: "three-quarter front view with the team logo and brim" },
  { id: "back", label: "Back", describe: "straight rear view with the snapback closure centred" },
  { id: "inside", label: "Inside / Underside", describe: "inside of the crown and underside of the brim" },
  { id: "side", label: "Side", describe: "side profile of the crown and brim" },
];

export interface SnapPhoto {
  src: string;
  alt: string;
}

/** Price for every hat in the collection, as set by the store. */
export const SNAPBACK_PRICE: number = data.price;

export interface ClassicSnapback {
  id: string;
  league: SnapLeague;
  team: string;
  slug: string;
  name: string;
  photos: Record<SnapView, SnapPhoto | null>;
  /** Views that still need a photo. */
  missing: SnapView[];
}

const EXTENSIONS = ["webp", "jpg", "jpeg", "png", "avif"];
const PUBLIC = path.join(process.cwd(), "public");

function findPhoto(league: SnapLeague, slug: string, view: SnapView): string | null {
  for (const ext of EXTENSIONS) {
    const rel = `/assets/hats/${league.toLowerCase()}/${slug}/${view}.${ext}`;
    if (fs.existsSync(path.join(PUBLIC, rel))) return rel;
  }
  return null;
}

let cache: ClassicSnapback[] | null = null;

export function getClassicSnapbacks(): ClassicSnapback[] {
  if (cache) return cache;
  cache = (data.hats as { id: string; league: SnapLeague; team: string; slug: string }[]).map((h) => {
    const name = `${h.team} Classic Snapback`;
    const photos = Object.fromEntries(
      SNAP_VIEWS.map((v) => {
        const src = findPhoto(h.league, h.slug, v.id);
        return [v.id, src ? { src, alt: `${name}, ${v.describe}` } : null];
      }),
    ) as Record<SnapView, SnapPhoto | null>;
    return { ...h, name, photos, missing: SNAP_VIEWS.map((v) => v.id).filter((v) => !photos[v]) };
  });
  return cache;
}

export function getClassicSnapback(slug: string) {
  return getClassicSnapbacks().find((h) => h.slug === slug);
}
