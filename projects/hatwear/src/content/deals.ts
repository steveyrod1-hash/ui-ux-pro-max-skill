/**
 * LIMITED-TIME DEALS: the only place deals are set.
 *
 * Each deal names a product by its web address (the part after /product/ in
 * its URL), the sale price, and when the deal ends. Deals switch themselves
 * off at `endsAt`, so the site never shows a promotion that has finished.
 *
 * Example: a $50 fitted on deal for $35 until the end of November:
 *   { product: "san-francisco-giants-59fifty-fitted", salePrice: 35, endsAt: "2026-11-30T23:59:00-08:00" }
 *
 * Deals can also be set without touching code: put the same list as JSON in
 * the NEXT_PUBLIC_DEALS environment variable in Vercel and redeploy.
 *
 * The sale price is what customers pay online. Through Clover it's charged as
 * a discount on the regular Clover price, so Clover reports show the deal.
 */
export interface Deal {
  /** Product web address, e.g. "crown-mark-fitted". */
  product: string;
  /** Sale price in dollars. Must be lower than the regular price. */
  salePrice: number;
  /** When the deal ends (ISO date-time with timezone). */
  endsAt: string;
  /** Optional: when the deal starts. Omit to start immediately. */
  startsAt?: string;
  /** Optional short label, e.g. "Black Friday". Defaults to "Limited time". */
  label?: string;
}

/** Real deals, used once the Clover catalog is connected. Only list deals the store is actually running. */
export const liveDeals: Deal[] = [];

/** Sample deals shown only in preview mode (sample catalog), so the section can be seen and tested. */
export const sampleDeals: Deal[] = [
  { product: "crown-mark-fitted", salePrice: 35, endsAt: "2026-11-30T23:59:00-08:00", label: "Limited time" },
  { product: "209-patch-snapback", salePrice: 28, endsAt: "2026-11-30T23:59:00-08:00", label: "Limited time" },
  { product: "ribbed-cuff-beanie", salePrice: 18, endsAt: "2026-11-30T23:59:00-08:00", label: "Limited time" },
  { product: "crown-heavyweight-hoodie", salePrice: 45, endsAt: "2026-11-30T23:59:00-08:00", label: "Limited time" },
];
