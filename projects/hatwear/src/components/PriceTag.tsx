"use client";

import type { Product } from "@/data/types";
import { priceFor } from "@/lib/deals";
import { money } from "@/lib/format";
import { useNow } from "@/lib/use-now";

const SIZES = {
  sm: { now: "font-semibold", was: "text-sm", save: "text-xs" },
  md: { now: "font-display text-3xl font-extrabold", was: "text-lg", save: "text-sm" },
  lg: { now: "font-display text-4xl font-black", was: "text-xl", save: "text-sm" },
};

/** Price with deal support: sale price, crossed-out regular price and the saving. */
export function PriceTag({ product, size = "sm", showSave = true, className = "" }: { product: Product; size?: keyof typeof SIZES; showSave?: boolean; className?: string }) {
  const now = useNow();
  const { price, was, deal } = priceFor(product, now);
  const s = SIZES[size];
  if (!deal || was === undefined) return <p className={`${s.now} tabular-nums ${className}`}>{money(price)}</p>;
  return (
    <p className={`flex items-baseline gap-x-2 gap-y-1 whitespace-nowrap tabular-nums ${showSave ? "flex-wrap" : ""} ${className}`}>
      <span className={`${s.now} text-sign-deep`}>
        <span className="sr-only">Sale price </span>
        {money(price)}
      </span>
      <s className={`${s.was} text-stone`}>
        <span className="sr-only">Regular price </span>
        {money(was)}
      </s>
      {showSave && <span className={`${s.save} label label-accent`}>Save {money(deal.save)}</span>}
    </p>
  );
}

/** Unit price for maths (bag totals, add-to-bag label). */
export function useUnitPrice(product: Product) {
  const now = useNow();
  return priceFor(product, now).price;
}
