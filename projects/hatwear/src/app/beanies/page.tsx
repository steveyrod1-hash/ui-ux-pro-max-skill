import type { Metadata } from "next";
import Link from "next/link";
import { getTeamBeanies, BEANIE_PRICE } from "@/lib/team-beanies";
import { SnapbackGrid } from "@/components/snapbacks/SnapbackGrid";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Team beanies",
  description: "NFL, NBA and MLB team knit beanies at HatWear in Stockton, CA.",
  alternates: { canonical: "/beanies" },
};

export default function BeaniesPage() {
  const beanies = getTeamBeanies();
  return (
    <div className="pb-24">
      <section className="navy-stage text-bone">
        <div className="shell grid grid-cols-1 gap-6 py-12 sm:py-16 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div className="min-w-0">
            <p className="eyebrow text-steel">NFL · NBA · MLB · {beanies.length} styles</p>
            <h1 className="mt-3 text-[clamp(2.4rem,1.1rem+6.4vw,7.5rem)] uppercase leading-[0.86]">
              Team
              <br />
              beanies
            </h1>
          </div>
          <p className="max-w-md text-lg text-bone/85">
            Pom knits and cuffed knits for NFL, NBA and MLB teams. Every beanie gets four photos: front, back, inside and side. To check a style is in stock,{" "}
            <a href={`tel:${site.phone.tel}`} className="link font-semibold text-white">
              call {site.phone.display}
            </a>{" "}
            or <Link href="/store" className="link font-semibold text-white">visit the shop</Link>.
          </p>
        </div>
      </section>
      <div className="shell pt-10">
        <SnapbackGrid
          price={BEANIE_PRICE}
          basePath="/beanies"
          kind="Team beanie"
          hats={beanies.map((b) => ({ slug: b.slug, team: b.team, name: b.name, league: b.league, front: b.photos.front, photoCount: Object.values(b.photos).filter(Boolean).length }))}
        />
      </div>
    </div>
  );
}
