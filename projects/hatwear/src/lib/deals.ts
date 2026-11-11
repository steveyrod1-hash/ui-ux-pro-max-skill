/**
 * Deal logic shared by the storefront and the checkout server, so the price a
 * customer sees is exactly the price Clover charges.
 */
import { liveDeals, sampleDeals, type Deal } from "@/content/deals";
import { getProductById, getProductBySlug, IS_LIVE_CATALOG, registerPriceResolver } from "@/lib/catalog";
import type { Product } from "@/data/types";

function fromEnv(): Deal[] | null {
  const raw = process.env.NEXT_PUBLIC_DEALS;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    console.warn("[deals] NEXT_PUBLIC_DEALS is not valid JSON; ignoring it.");
    return null;
  }
}

/** All configured deals for the current catalog (sample deals only in preview mode). */
const configured: Deal[] = fromEnv() ?? (IS_LIVE_CATALOG ? liveDeals : sampleDeals);

export interface ActiveDeal extends Deal {
  productObj: Product;
  ends: number;
  save: number;
  percentOff: number;
}

function valid(d: Deal): ActiveDeal | null {
  const p = getProductBySlug(d.product);
  const ends = Date.parse(d.endsAt);
  if (!p || !Number.isFinite(ends) || !(d.salePrice > 0) || d.salePrice >= p.price) return null;
  const save = Math.round((p.price - d.salePrice) * 100) / 100;
  return { ...d, productObj: p, ends, save, percentOff: Math.round((save / p.price) * 100) };
}

const DEALS: ActiveDeal[] = configured.map(valid).filter((d): d is ActiveDeal => d !== null);

export function isRunning(d: Pick<Deal, "startsAt" | "endsAt">, now = Date.now()) {
  const start = d.startsAt ? Date.parse(d.startsAt) : -Infinity;
  return now >= start && now < Date.parse(d.endsAt);
}

/** Deals running at `now`, soonest-ending first. */
export function activeDeals(now = Date.now()): ActiveDeal[] {
  return DEALS.filter((d) => isRunning(d, now)).sort((a, b) => a.ends - b.ends);
}

export function dealFor(productId: string, now = Date.now()): ActiveDeal | undefined {
  return DEALS.find((d) => d.productObj.id === productId && isRunning(d, now));
}

/** Price to show and charge right now, plus the regular price when on deal. */
export function priceFor(p: Product, now = Date.now()): { price: number; was?: number; deal?: ActiveDeal } {
  const d = dealFor(p.id, now);
  return d ? { price: d.salePrice, was: p.price, deal: d } : { price: p.price };
}

/** Per-unit discount in cents against a live Clover price (server side). */
export function discountCents(productId: string, livePriceCents: number, now = Date.now()) {
  const d = dealFor(productId, now);
  if (!d) return 0;
  return Math.max(0, livePriceCents - Math.round(d.salePrice * 100));
}

registerPriceResolver((p) => priceFor(p).price);

export { getProductById };
