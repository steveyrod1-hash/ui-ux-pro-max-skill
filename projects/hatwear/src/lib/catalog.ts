/**
 * Catalog access layer. Every page and component reads products through
 * these functions, so swapping the sample data for a commerce backend
 * (Shopify Storefront API, Square, a headless CMS) only means changing the
 * implementations below, not the UI.
 */
import { LEAGUES, sampleCatalog, TEAMS_BY_LEAGUE, TYPE_LABELS } from "@/data/catalog";
import cloverRaw from "@/data/clover-raw.generated.json";
import { mapCloverCatalog, type CloverRaw } from "@/lib/clover/map";
import type { Availability, League, Product, ProductType } from "@/data/types";

export { LEAGUES, TEAMS_BY_LEAGUE, TYPE_LABELS };

// Live Clover inventory when the build synced it; the sample catalog otherwise.
const live = cloverRaw ? mapCloverCatalog(cloverRaw as unknown as CloverRaw) : [];
const catalog: Product[] = live.length > 0 ? live : sampleCatalog;

/** True when products, prices and stock come from Clover. */
export const IS_LIVE_CATALOG = live.length > 0;
export const CATALOG_SYNCED_AT: string | null = cloverRaw ? (cloverRaw as unknown as CloverRaw).fetchedAt : null;

export const HAT_TYPES: ProductType[] = ["fitted", "snapback", "trucker", "adjustable", "beanie"];
export const APPAREL_TYPES: ProductType[] = ["hoodie", "windbreaker"];
export const isHat = (t: ProductType) => HAT_TYPES.includes(t);

export function getAllProducts(): Product[] {
  return catalog;
}

export function getProductBySlug(slug: string): Product | undefined {
  return catalog.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return catalog.find((p) => p.id === id);
}

export function unitsFor(p: Product, colorId?: string, size?: string): number {
  const colors = colorId ? [colorId] : Object.keys(p.stock);
  let n = 0;
  for (const c of colors) {
    const row = p.stock[c] ?? {};
    for (const s of size ? [size] : Object.keys(row)) n += row[s] ?? 0;
  }
  return n;
}

export function availability(units: number): Availability {
  if (units <= 0) return "sold-out";
  if (units <= 2) return "low-stock";
  return "in-stock";
}

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  "in-stock": "In stock",
  "low-stock": "Only a few left",
  "sold-out": "Sold out",
};

export function getNewArrivals(limit = 8): Product[] {
  return [...catalog]
    .filter((p) => p.isNew && unitsFor(p) > 0)
    .sort((a, b) => b.arrival - a.arrival)
    .slice(0, limit);
}

export function getRelated(p: Product, limit = 4): Product[] {
  const score = (q: Product) =>
    (q.team && q.team === p.team ? 4 : 0) + (q.type === p.type ? 2 : 0) + (q.league && q.league === p.league ? 1 : 0);
  return catalog
    .filter((q) => q.id !== p.id)
    .map((q) => ({ q, s: score(q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || b.q.arrival - a.q.arrival)
    .slice(0, limit)
    .map((x) => x.q);
}

// ---------------------------------------------------------------- filtering

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "name";

export const SORT_LABELS: Record<SortKey, string> = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  name: "Name: A to Z",
};

export interface Filters {
  q: string;
  type: ProductType[];
  league: League[];
  team: string[];
  brand: string[];
  size: string[];
  color: string[];
  price: string[]; // bucket ids
  inStock: boolean;
  sort: SortKey;
  page: number;
}

export const PRICE_BUCKETS = [
  { id: "under-30", label: "Under $30", min: 0, max: 30 },
  { id: "30-45", label: "$30 to $45", min: 30, max: 45 },
  { id: "45-60", label: "$45 to $60", min: 45, max: 60 },
  { id: "60-plus", label: "$60 and up", min: 60, max: Infinity },
];

export const PAGE_SIZE = 24;

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

export function parseFilters(sp: URLSearchParams): Filters {
  const sort = sp.get("sort") as SortKey | null;
  return {
    q: sp.get("q")?.trim() ?? "",
    type: list(sp.get("type")) as ProductType[],
    league: list(sp.get("league")) as League[],
    team: list(sp.get("team")),
    brand: list(sp.get("brand")),
    size: list(sp.get("size")),
    color: list(sp.get("color")),
    price: list(sp.get("price")),
    inStock: sp.get("instock") === "1",
    sort: sort && sort in SORT_LABELS ? sort : "featured",
    page: Math.max(1, Number(sp.get("page")) || 1),
  };
}

export function filtersToParams(f: Partial<Filters>): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  for (const k of ["type", "league", "team", "brand", "size", "color", "price"] as const) {
    const v = f[k];
    if (v && v.length) sp.set(k, v.join(","));
  }
  if (f.inStock) sp.set("instock", "1");
  if (f.sort && f.sort !== "featured") sp.set("sort", f.sort);
  if (f.page && f.page > 1) sp.set("page", String(f.page));
  return sp;
}

function normalize(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]/g, " ");
}

/** Every word in the query must match somewhere in the product. */
export function matchesQuery(p: Product, q: string) {
  if (!q) return true;
  const hay = normalize(
    [p.name, p.brand, p.team, p.league, TYPE_LABELS[p.type], p.mark, ...p.colorways.map((c) => `${c.name} ${c.family}`)].join(" "),
  );
  return normalize(q)
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w) || (w.endsWith("s") && hay.includes(w.slice(0, -1))));
}

type FacetKey = "type" | "league" | "team" | "brand" | "size" | "color" | "price";

function passes(p: Product, f: Filters, skip?: FacetKey): boolean {
  if (!matchesQuery(p, f.q)) return false;
  if (skip !== "type" && f.type.length && !f.type.includes(p.type)) return false;
  if (skip !== "league" && f.league.length && (!p.league || !f.league.includes(p.league))) return false;
  if (skip !== "team" && f.team.length && (!p.team || !f.team.includes(p.team))) return false;
  if (skip !== "brand" && f.brand.length && !f.brand.includes(p.brand)) return false;
  if (skip !== "color" && f.color.length && !p.colorways.some((c) => f.color.includes(c.family))) return false;
  if (skip !== "size" && f.size.length && !f.size.some((s) => p.sizes.includes(s) && unitsFor(p, undefined, s) > 0))
    return false;
  if (skip !== "price" && f.price.length) {
    const ok = PRICE_BUCKETS.filter((b) => f.price.includes(b.id)).some((b) => p.price >= b.min && p.price < b.max);
    if (!ok) return false;
  }
  if (f.inStock && unitsFor(p) <= 0) return false;
  return true;
}

function sortProducts(items: Product[], sort: SortKey) {
  const out = [...items];
  switch (sort) {
    case "newest":
      return out.sort((a, b) => b.arrival - a.arrival);
    case "price-asc":
      return out.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
    case "price-desc":
      return out.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
    case "name":
      return out.sort((a, b) => a.name.localeCompare(b.name));
    default:
      // Featured: new and in-stock first, then hats before apparel.
      return out.sort(
        (a, b) =>
          Number(unitsFor(b) > 0) - Number(unitsFor(a) > 0) ||
          Number(b.isNew) - Number(a.isNew) ||
          Number(isHat(b.type)) - Number(isHat(a.type)) ||
          b.arrival - a.arrival,
      );
  }
}

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

export interface QueryResult {
  items: Product[];
  total: number;
  page: number;
  pages: number;
  facets: Record<FacetKey, FacetOption[]>;
}

const count = (items: Product[], keyFn: (p: Product) => string[]) => {
  const m = new Map<string, number>();
  for (const p of items) for (const k of new Set(keyFn(p))) m.set(k, (m.get(k) ?? 0) + 1);
  return m;
};

export function queryProducts(f: Filters): QueryResult {
  const all = catalog;
  const matched = sortProducts(all.filter((p) => passes(p, f)), f.sort);
  const pages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  const page = Math.min(f.page, pages);

  // Facet counts reflect every other active filter, so options never lead to zero results.
  const facetBase = (k: FacetKey) => all.filter((p) => passes(p, f, k));
  // Options with matches, in a stable order; selected-but-empty options are merged back by withSelected.
  const order = <T extends string>(m: Map<string, number>, values: T[], label: (v: T) => string = (v) => v): FacetOption[] =>
    values.filter((v) => m.has(v)).map((v) => ({ value: v, label: label(v), count: m.get(v) ?? 0 }));

  const typeCounts = count(facetBase("type"), (p) => [p.type]);
  const leagueCounts = count(facetBase("league"), (p) => (p.league ? [p.league] : []));
  const teamCounts = count(facetBase("team"), (p) => (p.team ? [p.team] : []));
  const brandCounts = count(facetBase("brand"), (p) => [p.brand]);
  const sizeCounts = count(facetBase("size"), (p) => p.sizes.filter((s) => unitsFor(p, undefined, s) > 0));
  const colorCounts = count(facetBase("color"), (p) => p.colorways.map((c) => c.family));
  const priceCounts = count(facetBase("price"), (p) =>
    PRICE_BUCKETS.filter((b) => p.price >= b.min && p.price < b.max).map((b) => b.id),
  );

  const withSelected = (opts: FacetOption[], selected: string[], label: (v: string) => string = (v) => v) => {
    const have = new Set(opts.map((o) => o.value));
    return [...opts, ...selected.filter((v) => !have.has(v)).map((v) => ({ value: v, label: label(v), count: 0 }))];
  };

  const allTeams = LEAGUES.flatMap((l) => TEAMS_BY_LEAGUE[l]);
  const brands = [...new Set(all.map((p) => p.brand))].sort();
  const sizes = [...new Set(all.flatMap((p) => p.sizes))];
  const colors = [...new Set(all.flatMap((p) => p.colorways.map((c) => c.family)))].sort();

  return {
    items: matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: matched.length,
    page,
    pages,
    facets: {
      type: withSelected(order(typeCounts, [...HAT_TYPES, ...APPAREL_TYPES], (v) => TYPE_LABELS[v]), f.type, (v) => TYPE_LABELS[v as ProductType]),
      league: withSelected(order(leagueCounts, LEAGUES), f.league),
      team: withSelected(order(teamCounts, allTeams), f.team),
      brand: withSelected(order(brandCounts, brands), f.brand),
      size: withSelected(order(sizeCounts, sizes), f.size),
      color: withSelected(order(colorCounts, colors), f.color),
      price: withSelected(
        order(priceCounts, PRICE_BUCKETS.map((b) => b.id), (v) => PRICE_BUCKETS.find((b) => b.id === v)!.label),
        f.price,
        (v) => PRICE_BUCKETS.find((b) => b.id === v)?.label ?? v,
      ),
    },
  };
}

export function searchProducts(q: string, limit = 6): Product[] {
  if (!q.trim()) return [];
  return catalog.filter((p) => matchesQuery(p, q)).slice(0, limit);
}

export function teamCounts(): Record<string, number> {
  const m: Record<string, number> = {};
  for (const p of catalog) if (p.team) m[p.team] = (m[p.team] ?? 0) + 1;
  return m;
}
