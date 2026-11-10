import type { Metadata } from "next";
import Link from "next/link";
import { getAllProducts, LEAGUES, TEAMS_BY_LEAGUE, teamCounts } from "@/lib/catalog";
import { TEAM_CODES } from "@/data/catalog";
import { TeamBrowser } from "@/components/home/TeamBrowser";
import { ProductCard } from "@/components/ProductCard";
import type { League } from "@/data/types";
import { ArrowIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Shop by team: MLB, NFL and NBA",
  description: "Browse team hats and apparel by league and team at HatWear in Stockton, CA.",
  alternates: { canonical: "/teams" },
};

export default async function TeamsPage({ searchParams }: { searchParams: Promise<{ league?: string }> }) {
  const { league } = await searchParams;
  const initial = (LEAGUES as string[]).includes(league ?? "") ? (league as League) : "MLB";
  const all = getAllProducts();
  const counts = teamCounts();

  return (
    <div className="pb-24">
      <section className="twill bg-ink text-bone">
        <div className="shell py-14 sm:py-20">
          <h1 className="text-[clamp(3.4rem,1.6rem+8vw,9rem)] uppercase leading-[0.84]">
            Rep your
            <br />
            team
          </h1>
          <p className="mt-6 max-w-lg text-lg text-bone/80">Pick a league, then a team, and we'll show every style on the site for it.</p>
        </div>
      </section>
      <section className="shell py-14">
        <TeamBrowser leagues={LEAGUES} teams={TEAMS_BY_LEAGUE} counts={counts} codes={TEAM_CODES} initial={initial} />
        <p className="mt-6 max-w-[62ch] text-sm text-stone">
          Team products on this preview are sample data, shown with HatWear illustrations rather than league artwork. Official team logos will only appear on genuine licensed merchandise and its photography.
        </p>
      </section>
      {LEAGUES.map((l) => {
        const items = all.filter((p) => p.league === l && p.type === "fitted").slice(0, 4);
        return (
          <section key={l} className="shell py-10" aria-labelledby={`l-${l}`}>
            <div className="flex items-end justify-between gap-4">
              <h2 id={`l-${l}`} className="text-[clamp(2.2rem,1.6rem+3vw,4rem)] uppercase">
                {l} fitteds
              </h2>
              <Link href={`/shop?league=${l}`} className="link inline-flex items-center gap-2 font-semibold">
                All {l} <ArrowIcon size={18} />
              </Link>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
              {items.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
