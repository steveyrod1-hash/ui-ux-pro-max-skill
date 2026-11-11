"use client";

import Link from "next/link";
import { activeDeals } from "@/lib/deals";
import { useNow } from "@/lib/use-now";
import { DEMO_CATALOG } from "@/content/site";
import { ProductCard } from "../ProductCard";
import { ArrowIcon } from "../Icons";
import { Countdown } from "./Countdown";

/** Homepage strip of running deals. Renders nothing when no deal is running. */
export function DealsSection({ limit = 4 }: { limit?: number }) {
  const now = useNow(30_000);
  const deals = activeDeals(now);
  if (deals.length === 0) return null;
  const soonest = deals[0];
  const best = Math.max(...deals.map((d) => d.percentOff));

  return (
    <section className="border-y-2 border-ink bg-white" aria-labelledby="deals-title">
      <div className="shell py-14 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="label label-accent">{soonest.label ?? "Limited time"} · up to {best}% off</p>
            <h2 id="deals-title" className="mt-3 text-[clamp(2.6rem,1.6rem+4vw,5rem)] uppercase">
              Limited-time deals
            </h2>
            <p className="mt-2 max-w-md text-graphite">Deal prices on hats and hoodies, for a short time and while sizes last.</p>
            {DEMO_CATALOG && <p className="mt-1 text-sm text-stone">Sample deals for this preview.</p>}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Ends in</p>
            <Countdown endsAt={soonest.ends} />
          </div>
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
          {deals.slice(0, limit).map((d) => (
            <li key={d.productObj.id}>
              <ProductCard product={d.productObj} />
            </li>
          ))}
        </ul>
        {deals.length > limit && (
          <Link href="/deals" className="link mt-8 inline-flex items-center gap-2 font-semibold">
            See all {deals.length} deals <ArrowIcon size={18} />
          </Link>
        )}
      </div>
    </section>
  );
}
