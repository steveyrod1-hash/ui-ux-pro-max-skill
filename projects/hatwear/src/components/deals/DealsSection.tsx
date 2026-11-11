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
    <section className="navy-stage text-bone" aria-labelledby="deals-title">
      <div className="shell py-14 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="label label-accent">{soonest.label ?? "Limited time"} · up to {best}% off</p>
            <h2 id="deals-title" className="mt-3 text-[clamp(2.2rem,1.5rem+3vw,3.9rem)] uppercase">
              Limited-time deals
            </h2>
            <p className="mt-2 max-w-md text-bone/85">Deal prices on hats and hoodies, for a short time and while sizes last.</p>
            {DEMO_CATALOG && <p className="mt-1 text-sm text-steel">Sample deals for this preview.</p>}
          </div>
          <div>
            <p className="eyebrow mb-2 text-steel">Ends in</p>
            <Countdown endsAt={soonest.ends} tone="dark" />
          </div>
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {deals.slice(0, limit).map((d) => (
            <li key={d.productObj.id}>
              <ProductCard product={d.productObj} />
            </li>
          ))}
        </ul>
        {deals.length > limit && (
          <Link href="/deals" className="link mt-8 inline-flex min-h-11 items-center gap-2 font-semibold text-white">
            See all {deals.length} deals <ArrowIcon size={18} />
          </Link>
        )}
      </div>
    </section>
  );
}
