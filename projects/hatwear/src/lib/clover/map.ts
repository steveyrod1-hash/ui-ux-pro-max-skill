/**
 * Turns raw Clover inventory (items, item groups, variant options, stock)
 * into the site's Product model. Pure function: no network, same result on
 * server and client.
 *
 * How HatWear's Clover inventory is read:
 * - An item group (e.g. "Giants 59FIFTY Black") is one product; each item in
 *   it is a variant whose options give its Size and Colour.
 * - A standalone item (no group) is a one-variant product.
 * - Hat style comes from the item's categories or name: Fitted, Snapback,
 *   Trucker, Dad/Adjustable, Beanie, Hoodie, Windbreaker. Items that are none
 *   of these (e.g. an "Embroidery" service) are left off the website.
 * - Team and league are matched from the name; brand from tags or name.
 */
import type { ArtColors, ColorFamily, League, Product, ProductType } from "@/data/types";
import { CARE, DETAILS, FITTED_SIZES, ONE_SIZE, TEAMS } from "@/data/catalog";
import { DEFAULT_STYLE, detectStyle } from "@/data/styles";

interface CloverOption {
  id: string;
  name: string;
  attribute?: { id: string };
}
interface CloverItem {
  id: string;
  name: string;
  price?: number;
  hidden?: boolean;
  available?: boolean;
  modifiedTime?: number;
  itemGroup?: { id: string; name?: string };
  options?: { elements?: CloverOption[] };
  categories?: { elements?: { id: string; name?: string }[] };
  tags?: { elements?: { id: string; name?: string }[] };
  itemStock?: { quantity?: number };
}
interface CloverAttribute {
  id: string;
  name: string;
  options?: { elements?: { id: string; name: string }[] };
}
export interface CloverRaw {
  fetchedAt: string;
  items: CloverItem[];
  attributes: CloverAttribute[];
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, "and").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const TYPE_RULES: [RegExp, ProductType][] = [
  [/\b(fitted|59fifty|59 fifty)\b/i, "fitted"],
  [/\bsnap ?back\b/i, "snapback"],
  [/\btrucker\b/i, "trucker"],
  [/\b(dad hat|dad cap|adjustable|strapback|slouch|clean ?up|9twenty)\b/i, "adjustable"],
  [/\b(beanie|knit|toque)\b/i, "beanie"],
  [/\b(hoodie|hooded|sweatshirt|crewneck)\b/i, "hoodie"],
  [/\b(windbreaker|jacket|track ?jacket)\b/i, "windbreaker"],
];

const COLORS: [RegExp, ColorFamily, string][] = [
  [/navy/i, "Navy", "#1d3557"],
  [/royal|blue/i, "Royal", "#24468a"],
  [/black/i, "Black", "#1c1b1a"],
  [/char|grey|gray|graphite|heather/i, "Charcoal", "#4a4a4a"],
  [/white|cream|bone|ivory|off.?white/i, "White", "#eef1f5"],
  [/red|scarlet|cardinal|maroon|burgundy/i, "Red", "#b51f2a"],
  [/green|kelly|forest|olive/i, "Green", "#1f5c3a"],
  [/purple|violet/i, "Purple", "#4b2a72"],
  [/brown|chocolate|coffee/i, "Brown", "#4a3426"],
  [/gold|yellow/i, "Gold", "#e3b13a"],
  [/tan|khaki|sand|stone|camel/i, "Tan", "#c9b48f"],
  [/orange/i, "Red", "#e2652a"],
  [/pink/i, "Red", "#e48aa6"],
];

const BRANDS: [RegExp, string][] = [
  [/new ?era|59fifty|9fifty|9twenty/i, "New Era"],
  [/'?47\b|forty.?seven/i, "'47"],
  [/mitchell/i, "Mitchell & Ness"],
  [/nike/i, "Nike"],
  [/fanatics/i, "Fanatics"],
];

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

function colorArt(name: string): { family: ColorFamily; art: ArtColors; swatch: string } {
  // "Black/Red" → crown from the first colour, mark from the second.
  const parts = name.split(/[\/,&+]| and /i).map((s) => s.trim()).filter(Boolean);
  const hex = (s: string) => COLORS.find(([re]) => re.test(s));
  const main = hex(parts[0] ?? name) ?? COLORS[2];
  const second = parts[1] ? hex(parts[1]) : undefined;
  const crown = main[2];
  const mark = second?.[2] ?? (luminance(crown) > 0.6 ? "#1d3557" : "#ffffff");
  return { family: main[1], swatch: crown, art: { crown, visor: crown, under: "#2a2a2a", button: crown, mark, trim: second?.[2] ?? "#e9e4da" } };
}

const TEAM_INDEX = TEAMS.map((t) => {
  const words = t.name.split(" ");
  const nickname = words[words.length - 1];
  return { team: t, re: new RegExp(`\\b(${t.name}|${nickname})\\b`, "i") };
});

function detectTeam(text: string) {
  return TEAM_INDEX.find((x) => x.re.test(text))?.team;
}

function detectLeague(text: string): League | undefined {
  const m = text.match(/\b(MLB|NFL|NBA)\b/i);
  return m ? (m[1].toUpperCase() as League) : undefined;
}

function initials(name: string) {
  const w = name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter((x) => x.length > 1);
  return (w.slice(0, 2).map((x) => x[0]).join("") || "HW").toUpperCase();
}

function sortSizes(sizes: string[]) {
  const apparel = ["XS", "S", "M", "L", "XL", "2XL", "XXL", "3XL", "XXXL"];
  const rank = (s: string) => {
    const f = FITTED_SIZES.indexOf(s);
    if (f >= 0) return f;
    const a = apparel.indexOf(s.toUpperCase());
    return a >= 0 ? 100 + a : 200;
  };
  return [...sizes].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

export function mapCloverCatalog(raw: CloverRaw): Product[] {
  const attrName = new Map<string, string>();
  const optionAttr = new Map<string, string>();
  for (const a of raw.attributes ?? []) {
    attrName.set(a.id, a.name);
    for (const o of a.options?.elements ?? []) optionAttr.set(o.id, a.name);
  }

  // Group variants.
  const groups = new Map<string, { name: string; items: CloverItem[] }>();
  for (const it of raw.items ?? []) {
    if (it.hidden) continue;
    const key = it.itemGroup?.id ?? `item-${it.id}`;
    const g = groups.get(key) ?? { name: it.itemGroup?.name ?? it.name, items: [] };
    g.items.push(it);
    groups.set(key, g);
  }

  const products: Product[] = [];
  const usedSlugs = new Set<string>();
  const newest = Math.max(0, ...(raw.items ?? []).map((i) => i.modifiedTime ?? 0));

  for (const [key, g] of groups) {
    const first = g.items[0];
    const cats = (first.categories?.elements ?? []).map((c) => c.name ?? "").join(" ");
    const tags = (first.tags?.elements ?? []).map((t) => t.name ?? "").join(" ");
    const text = `${g.name} ${cats} ${tags}`;
    const style = detectStyle(text);
    let type = style?.type ?? TYPE_RULES.find(([re]) => re.test(text))?.[1];

    const variants = g.items.map((it) => {
      let size = ONE_SIZE;
      let color = "One colour";
      for (const o of it.options?.elements ?? []) {
        const attr = (o.attribute?.id && attrName.get(o.attribute.id)) || optionAttr.get(o.id) || "";
        if (/size/i.test(attr)) size = o.name.trim();
        else if (/colou?r/i.test(attr)) color = o.name.trim();
      }
      return { it, size, color };
    });

    // Fitted sizes give the style away even when the name doesn't.
    if (!type && variants.some((v) => FITTED_SIZES.includes(v.size))) type = "fitted";
    if (!type) continue;

    const team = detectTeam(text);
    const league = detectLeague(text) ?? team?.league;
    const colorNames = [...new Set(variants.map((v) => v.color))];
    const sizes = sortSizes([...new Set(variants.map((v) => v.size))]);
    const colorways = colorNames.map((name) => {
      const c = colorArt(name === "One colour" ? g.name : name);
      return { id: slugify(name) || "standard", name, family: c.family, swatch: c.swatch, art: c.art };
    });

    const stock: Product["stock"] = {};
    const variantIds: NonNullable<Product["variantIds"]> = {};
    for (const v of variants) {
      const cid = slugify(v.color) || "standard";
      stock[cid] ??= {};
      variantIds[cid] ??= {};
      const q = v.it.available === false ? 0 : v.it.itemStock ? Math.max(0, Math.floor(v.it.itemStock.quantity ?? 0)) : 10;
      stock[cid][v.size] = q;
      variantIds[cid][v.size] = v.it.id;
    }

    let slug = slugify(g.name) || slugify(key);
    if (usedSlugs.has(slug)) slug = `${slug}-${slugify(key).slice(-6)}`;
    usedSlugs.add(slug);

    const price = Math.min(...variants.map((v) => (v.it.price ?? 0) / 100));
    // Variable-price or unpriced items can't be sold online.
    if (!(price > 0)) continue;
    const modified = Math.max(...g.items.map((i) => i.modifiedTime ?? 0));

    products.push({
      id: `cl-${key}`,
      slug,
      name: g.name,
      type,
      style: style?.id ?? DEFAULT_STYLE[type],
      brand: BRANDS.find(([re]) => re.test(text))?.[1] ?? "HatWear",
      league,
      team: team?.name,
      mark: team?.code ?? initials(g.name),
      price,
      colorways,
      sizes,
      stock,
      variantIds,
      description: `${g.name}, in stock at HatWear in Stockton.`,
      details: DETAILS[type],
      care: CARE[type],
      isNew: newest - modified < 1000 * 60 * 60 * 24 * 30,
      arrival: modified,
      source: "clover",
    });
  }
  return products;
}
