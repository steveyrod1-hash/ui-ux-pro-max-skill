"use client";

import Link from "next/link";
import { activeDeals } from "@/lib/deals";
import { useNow } from "@/lib/use-now";
import { DEMO_CATALOG, site } from "@/content/site";
import { ProductCard } from "@/components/ProductCard";
import { Countdown } from "@/components/deals/Countdown";

export function DealsPage() {
  const now = useNow(30_000);
  const deals = activeDeals(now);
  return (
    <div className="pb-24">
      <section className="navy-stage text-bone">
        <div className="shell flex flex-wrap items-end justify-between gap-8 py-14 sm:py-20">
          <div>
            <p className="eyebrow text-steel">Limited time</p>
            <h1 className="mt-3 text-[clamp(3rem,1.4rem+7vw,7.5rem)] uppercase leading-[0.86]">Deals</h1>
            <p className="mt-5 max-w-lg text-lg text-bone/80">Limited-time prices on hats and hoodies. When the timer hits zero, prices go back to normal.</p>
            {DEMO_CATALOG && deals.length > 0 && <p className="mt-2 text-sm text-bone/60">Sample deals for this preview.</p>}
          </div>
          {deals.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-bone/80">Next deal ends in</p>
              <Countdown endsAt={deals[0].ends} tone="dark" />
            </div>
          )}
        </div>
      </section>
      <div className="shell pt-12">
        {deals.length === 0 ? (
          <div className="grid place-items-center bg-felt px-6 py-20 text-center">
            <p className="font-display text-4xl font-black uppercase">No deals running right now</p>
            <p className="mt-2 max-w-md text-graphite">
              Follow the store for the next one.{" "}
              <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="link font-semibold text-ink">
                Follow @{site.instagram.handle}
              </a>
              .
            </p>
            <Link href="/shop" className="btn btn-dark mt-6">
              Shop everything
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
            {deals.map((d) => (
              <li key={d.productObj.id}>
                <ProductCard product={d.productObj} />
                <p className="mt-1 text-xs text-stone">
                  Ends {new Date(d.ends).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: site.timeZone })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
