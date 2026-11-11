/**
 * Headwear styles HatWear sells, grouped for the Shop menu and the catalog
 * filters. `match` recognises the style in Clover item names / categories;
 * `type` is the closest base shape used for sizing and the illustrations.
 */
import type { ProductType } from "./types";

export type StyleGroup = "caps" | "beanies" | "hats" | "apparel";

export interface Style {
  id: string;
  label: string;
  group: StyleGroup;
  type: ProductType;
  match: RegExp;
}

export const STYLE_GROUPS: { id: StyleGroup; label: string; blurb: string }[] = [
  { id: "caps", label: "Caps", blurb: "Fitteds, snapbacks, truckers and more" },
  { id: "beanies", label: "Beanies", blurb: "Cuffed, pom, docker and knit" },
  { id: "hats", label: "Hats", blurb: "Buckets and brimmed hats" },
  { id: "apparel", label: "Apparel", blurb: "Hoodies and windbreakers" },
];

// Order matters: more specific patterns first.
export const STYLES: Style[] = [
  // Caps
  { id: "fitted", label: "Fitted", group: "caps", type: "fitted", match: /\b(fitted|59fifty|59 fifty)\b/i },
  { id: "snapback", label: "Snapback", group: "caps", type: "snapback", match: /\bsnap ?back\b/i },
  { id: "stretch-fit", label: "Stretch Fit", group: "caps", type: "fitted", match: /\b(stretch ?fit|flex ?fit|39thirty)\b/i },
  { id: "trucker", label: "Trucker", group: "caps", type: "trucker", match: /\btrucker\b/i },
  { id: "dad-cap", label: "Dad Cap", group: "caps", type: "adjustable", match: /\b(dad (hat|cap)|clean ?up|9twenty|slouch)\b/i },
  { id: "adjustable", label: "Adjustable", group: "caps", type: "adjustable", match: /\b(adjustable|strapback|9forty)\b/i },
  { id: "five-panel", label: "5-Panel", group: "caps", type: "adjustable", match: /\b(5|five)[ -]?panel\b/i },
  { id: "flat-cap", label: "Flat Cap", group: "caps", type: "adjustable", match: /\b(flat cap|ivy|newsboy|driver cap)\b/i },
  // Beanies
  { id: "pom-beanie", label: "Pom Beanie", group: "beanies", type: "beanie", match: /\b(pom|pom-pom|bobble)\b/i },
  { id: "docker", label: "Docker", group: "beanies", type: "beanie", match: /\bdocker\b/i },
  { id: "trapper", label: "Trapper", group: "beanies", type: "beanie", match: /\b(trapper|aviator|ear ?flap)\b/i },
  { id: "short-beanie", label: "Short Beanie", group: "beanies", type: "beanie", match: /\b(short|fisherman|watch cap)\b.*\bbeanie|\bfisherman\b/i },
  { id: "long-beanie", label: "Long Beanie", group: "beanies", type: "beanie", match: /\b(long|slouchy?)\b.*\bbeanie/i },
  { id: "knit-beanie", label: "Knitted Beanie", group: "beanies", type: "beanie", match: /\b(cable|chunky) ?knit\b/i },
  { id: "traditional-beanie", label: "Traditional Beanie", group: "beanies", type: "beanie", match: /\b(traditional|uncuffed|no cuff)\b/i },
  { id: "cuff-beanie", label: "Cuff Beanie", group: "beanies", type: "beanie", match: /\b(beanie|knit|toque|cuff)\b/i },
  // Hats
  { id: "bucket", label: "Bucket", group: "hats", type: "bucket", match: /\bbucket\b/i },
  { id: "fedora", label: "Fedora", group: "hats", type: "bucket", match: /\bfedora\b/i },
  { id: "pork-pie", label: "Pork Pie", group: "hats", type: "bucket", match: /\bpork ?pie\b/i },
  { id: "straw-hat", label: "Straw Hat", group: "hats", type: "bucket", match: /\bstraw\b/i },
  { id: "trilby", label: "Trilby", group: "hats", type: "bucket", match: /\btrilby\b/i },
  { id: "traveler", label: "Traveler", group: "hats", type: "bucket", match: /\btravell?er\b/i },
  { id: "bowler", label: "Bowler", group: "hats", type: "bucket", match: /\b(bowler|derby)\b/i },
  { id: "sun-hat", label: "Sun Hat", group: "hats", type: "bucket", match: /\b(sun hat|wide brim|boonie)\b/i },
  // Apparel
  { id: "hoodie", label: "Hoodies", group: "apparel", type: "hoodie", match: /\b(hoodie|hooded|sweatshirt|crewneck)\b/i },
  { id: "windbreaker", label: "Windbreakers", group: "apparel", type: "windbreaker", match: /\b(windbreaker|jacket)\b/i },
];

export const STYLE_BY_ID: Record<string, Style> = Object.fromEntries(STYLES.map((s) => [s.id, s]));

export function detectStyle(text: string): Style | undefined {
  return STYLES.find((s) => s.match.test(text));
}

/** Default style for a base type when nothing more specific is known. */
export const DEFAULT_STYLE: Record<ProductType, string> = {
  fitted: "fitted",
  snapback: "snapback",
  trucker: "trucker",
  adjustable: "dad-cap",
  beanie: "cuff-beanie",
  bucket: "bucket",
  hoodie: "hoodie",
  windbreaker: "windbreaker",
};
