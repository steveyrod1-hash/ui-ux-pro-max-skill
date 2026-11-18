import type { Metadata } from "next";
import Link from "next/link";
import { getClassicSnapbacks, SNAPBACK_PRICE } from "@/lib/classic-snapbacks";
import { money } from "@/lib/format";
import { SnapbackGrid } from "@/components/snapbacks/SnapbackGrid";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Classic Snapbacks: 59 MLB and NFL teams",
  description: "Classic flat-brim snapbacks for 29 MLB and 30 NFL teams at HatWear in Stockton, CA, $39.99 each.",
  alternates: { canonical: "/snapbacks" },
};

export default function SnapbacksPage() {
  const hats = getClassicSnapbacks();
  const mlb = hats.filter((h) => h.league === "MLB").length;
  const nfl = hats.length - mlb;
  return (
    <div className="pb-24">
      <section className="navy-stage text-bone">
        <div className="shell grid grid-cols-1 gap-6 py-12 sm:py-16 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div className="min-w-0">
            <p className="eyebrow text-steel">
              {mlb} MLB · {nfl} NFL
            </p>
            <h1 className="mt-3 text-[clamp(2.15rem,1.1rem+6.4vw,7.5rem)] uppercase leading-[0.86]">
              Classic
              <br />
              snapbacks
            </h1>
          </div>
          <p className="max-w-md text-lg text-bone/85">
            Flat brim, adjustable snap closure, {hats.length} teams, {money(SNAPBACK_PRICE)} each. Every hat gets four photos: front, back, inside and side. To check your team is in stock,{" "}
            <a href={`tel:${site.phone.tel}`} className="link font-semibold text-white">
              call {site.phone.display}
            </a>{" "}
            or <Link href="/store" className="link font-semibold text-white">visit the shop</Link>.
          </p>
        </div>
      </section>
      <div className="shell pt-10">
        <SnapbackGrid
          price={SNAPBACK_PRICE}
          hats={hats.map((h) => ({
            slug: h.slug,
            team: h.team,
            league: h.league,
            front: h.photos.front,
            photoCount: 4 - h.missing.length,
          }))}
        />
      </div>
    </div>
  );
}
