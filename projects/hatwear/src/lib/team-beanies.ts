/**
 * Team beanies supplied by the owner, each with four photos in
 * public/assets/beanies/<slug>/<front|back|inside|side>.webp.
 * Add one by adding an entry to src/data/team-beanies.json plus its photos.
 * Server-only (reads the filesystem).
 */
import fs from "node:fs";
import path from "node:path";
import data from "@/data/team-beanies.json";

export type BeanieView = "front" | "back" | "inside" | "side";

export const BEANIE_VIEWS: { id: BeanieView; label: string; describe: string }[] = [
  { id: "front", label: "Front", describe: "front view with the team logo" },
  { id: "back", label: "Back", describe: "back view" },
  { id: "inside", label: "Inside", describe: "inside of the beanie" },
  { id: "side", label: "Side", describe: "three-quarter side view" },
];

/** Price for every beanie, once the store sets it. Null shows "Ask in store". */
export const BEANIE_PRICE: number | null = data.price;

export interface TeamBeanie {
  slug: string;
  team: string;
  league: "NFL" | "MLB";
  name: string;
  pom: boolean;
  description: string;
  photos: Record<BeanieView, { src: string; alt: string } | null>;
}

const PUBLIC = path.join(process.cwd(), "public");
let cache: TeamBeanie[] | null = null;

export function getTeamBeanies(): TeamBeanie[] {
  if (cache) return cache;
  cache = (data.beanies as Omit<TeamBeanie, "photos">[]).map((b) => {
    const photos = Object.fromEntries(
      BEANIE_VIEWS.map((v) => {
        const src = ["webp", "jpg", "jpeg", "png"].map((e) => `/assets/beanies/${b.slug}/${v.id}.${e}`).find((rel) => fs.existsSync(path.join(PUBLIC, rel)));
        return [v.id, src ? { src, alt: `${b.name}, ${v.describe}` } : null];
      }),
    ) as TeamBeanie["photos"];
    return { ...b, photos };
  });
  return cache;
}

export const getTeamBeanie = (slug: string) => getTeamBeanies().find((b) => b.slug === slug);
