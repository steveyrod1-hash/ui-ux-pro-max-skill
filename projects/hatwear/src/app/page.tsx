import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { FeatureStrip } from "@/components/home/FeatureStrip";
import { SectionHeading } from "@/components/SectionHeading";
import { DealsSection } from "@/components/deals/DealsSection";
import { TeamBrowser } from "@/components/home/TeamBrowser";
import { EmbroideryShowcase } from "@/components/home/EmbroideryShowcase";
import { ProductCard } from "@/components/ProductCard";
import { ProductArt } from "@/components/ProductArt";
import { RevealImage, Stagger, StaggerItem } from "@/components/Reveal";
import { AddressBlock, HoursList, MapFrame, StoreActions } from "@/components/StoreVisit";
import { ArrowIcon } from "@/components/Icons";
import { getAllProducts, getNewArrivals, LEAGUES, TEAMS_BY_LEAGUE, teamCounts, unitsFor } from "@/lib/catalog";
import { TEAM_CODES } from "@/data/catalog";
import type { ArtColors, ProductType } from "@/data/types";
import { DEMO_CATALOG } from "@/content/site";

const NAVY = "#0b1f3a";
const ROYAL = "#2456c4";
const WHITE = "#ffffff";

const STYLES: { label: string; href: string; types: ProductType[]; art: { type: ProductType; colors: ArtColors; mark: string }; tone: "dark" | "felt" | "royal" | "chalk"; blurb: string }[] = [
  {
    label: "Fitted Hats",
    href: "/shop?type=fitted",
    types: ["fitted"],
    art: { type: "fitted", mark: "HW", colors: { crown: "#13294c", visor: "#13294c", under: "#24406b", button: "#13294c", mark: WHITE } },
    tone: "dark",
    blurb: "Sized to your head, not adjustable.",
  },
  {
    label: "Snapbacks",
    href: "/shop?type=snapback",
    types: ["snapback"],
    art: { type: "snapback", mark: "209", colors: { crown: WHITE, visor: NAVY, under: "#24406b", button: NAVY, mark: NAVY } },
    tone: "felt",
    blurb: "Flat brim, one size, snap closure.",
  },
  {
    label: "Trucker Hats",
    href: "/shop?type=trucker",
    types: ["trucker"],
    art: { type: "trucker", mark: "HW", colors: { crown: NAVY, visor: NAVY, under: "#24406b", button: NAVY, mark: WHITE, trim: WHITE } },
    tone: "chalk",
    blurb: "Foam front, mesh back.",
  },
  {
    label: "Beanies",
    href: "/shop?type=beanie",
    types: ["beanie"],
    art: { type: "beanie", mark: "HATWEAR", colors: { crown: WHITE, visor: WHITE, under: WHITE, button: WHITE, mark: NAVY, trim: "#e3e9f2" } },
    tone: "royal",
    blurb: "Cuffed rib knits.",
  },
  {
    label: "Apparel",
    href: "/shop?type=hoodie,windbreaker",
    types: ["hoodie", "windbreaker"],
    art: { type: "hoodie", mark: "HW", colors: { crown: "#13294c", visor: "#13294c", under: "#13294c", button: "#13294c", mark: WHITE, trim: ROYAL } },
    tone: "felt",
    blurb: "Hoodies and windbreakers.",
  },
];

const TONE: Record<(typeof STYLES)[number]["tone"], string> = {
  dark: "navy-stage text-bone",
  felt: "bg-felt text-ink",
  royal: "bg-sign text-white",
  chalk: "bg-white text-ink ring-1 ring-ink/8",
};

export default function Home() {
  const all = getAllProducts();
  // Featured collection: newest arrivals, topped up with in-stock hats.
  const isHeadwear = (p: (typeof all)[number]) => !["hoodie", "windbreaker"].includes(p.type);
  const featured = getNewArrivals(20).filter(isHeadwear).slice(0, 10);
  for (const p of all) {
    if (featured.length >= 10) break;
    if (!featured.includes(p) && unitsFor(p) > 0 && isHeadwear(p)) featured.push(p);
  }
  const countFor = (types: ProductType[]) => all.filter((p) => types.includes(p.type)).length;

  return (
    <>
      <Hero />
      <FeatureStrip />

      {/* Featured collection */}
      {featured.length > 0 && (
        <section className="bg-chalk py-14 sm:py-20" aria-labelledby="featured-title">
          <div className="shell">
            <SectionHeading id="featured-title" eyebrow="Featured collection" title="New on the wall" action={{ href: "/shop?sort=newest", label: "View all" }}>
              {DEMO_CATALOG && <p className="mt-2 text-sm text-stone">Sample products for this preview. Real arrivals appear here once the catalog is connected.</p>}
            </SectionHeading>
            <Stagger className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5">
              {featured.map((p, i) => (
                <StaggerItem key={p.id} className={i === 6 || i === 7 ? "max-sm:hidden" : i === 8 ? "max-sm:hidden lg:max-xl:hidden" : i === 9 ? "max-xl:hidden" : ""}>
                  <ProductCard product={p} priority={i < 2} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      <DealsSection />

      {/* Shop by style */}
      <section className="shell py-16 sm:py-24" aria-labelledby="styles-title">
        <SectionHeading id="styles-title" eyebrow="Find your fit" title="Shop by style" action={{ href: "/shop", label: "Shop all" }} />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-2">
          {STYLES.map((s, i) => (
            <RevealImage
              key={s.label}
              delay={i * 0.06}
              className={i === 0 ? "col-span-2 row-span-1 lg:row-span-2" : ""}
            >
              <Link href={s.href} className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-[var(--radius-card)] p-5 sm:p-6 ${TONE[s.tone]} ${i === 0 ? "min-h-[21rem] lg:min-h-[34rem]" : "min-h-[15rem] lg:min-h-[16.5rem]"}`}>
                <div className="relative z-10">
                  <h3 className={`uppercase italic ${i === 0 ? "text-[clamp(2.2rem,1.6rem+2.6vw,4rem)]" : "text-[1.08rem] max-sm:[font-variation-settings:'wdth'_100] min-[400px]:text-[1.2rem] sm:text-[clamp(1.35rem,1rem+1.1vw,1.95rem)]"}`}>{s.label}</h3>
                  <p className={`mt-2 max-w-[13rem] text-sm ${s.tone === "dark" ? "text-steel" : s.tone === "royal" ? "text-white/85" : "text-graphite"}`}>{s.blurb}</p>
                </div>
                <div
                  className={`pointer-events-none absolute transition-transform duration-500 ease-[cubic-bezier(.25,1,.5,1)] group-hover:-translate-y-2 group-hover:scale-[1.03] ${
                    i === 0 ? "-bottom-[12%] -right-[6%] w-[66%] sm:w-[58%] lg:-bottom-[6%] lg:-right-[8%] lg:w-[86%]" : "-bottom-[10%] -right-[12%] w-[78%]"
                  }`}
                >
                  <ProductArt {...s.art} className="w-full" />
                </div>
                <span className="relative z-10 inline-flex items-center gap-2 text-sm font-semibold">
                  {countFor(s.types)} styles <ArrowIcon size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </RevealImage>
          ))}
        </div>
      </section>

      {/* Shop by team */}
      <section className="shell grid gap-10 py-16 sm:py-24 lg:grid-cols-[1fr_1.6fr] lg:gap-16" aria-labelledby="teams-title">
        <div>
          <p className="eyebrow text-stone">MLB · NFL · NBA</p>
          <h2 id="teams-title" className="mt-2 text-[clamp(2.2rem,1.5rem+3vw,3.9rem)] uppercase">
            Rep your team
          </h2>
          <p className="mt-4 max-w-sm text-lg text-graphite">
            Baseball, football and basketball. Pick a league, then a team.
          </p>
          <p className="mt-4 max-w-sm text-sm text-stone">Team merchandise shown here is sample data. Official logos appear only on genuine licensed products and their photos.</p>
        </div>
        <TeamBrowser leagues={LEAGUES} teams={TEAMS_BY_LEAGUE} counts={teamCounts()} codes={TEAM_CODES} />
      </section>

      {/* Embroidery */}
      <section className="navy-stage text-bone" aria-labelledby="custom-title">
        <div className="shell grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-2 lg:gap-16">
          <RevealImage>
            <EmbroideryShowcase />
          </RevealImage>
          <div>
            <p className="eyebrow text-steel">Custom embroidery · done in store</p>
            <h2 id="custom-title" className="mt-3 text-[clamp(2.8rem,1.6rem+5vw,6rem)] uppercase">
              Your hat.
              <br />
              Your mark.
            </h2>
            <p className="mt-5 max-w-md text-lg text-bone/85">
              Names, numbers, a crew logo or your business mark, stitched onto a hat or beanie in the shop. Starting at $7.99. The store reviews every request and confirms the exact price and timing with you before anything is made.
            </p>
            <ol className="mt-8 space-y-0 border-t border-bone/15">
              {[
                ["Pick the hat", "Fitted, snapback, trucker, dad cap, beanie or bucket hat, in the colour you want."],
                ["Add your mark", "Type your text or upload artwork, choose thread and placement, and see a live preview."],
                ["Send the request", "HatWear checks the details and contacts you with a quote."],
              ].map(([t, d], i) => (
                <li key={t} className="grid grid-cols-[2.6rem_1fr] gap-3 border-b border-bone/15 py-4">
                  <span className="font-display text-3xl font-black text-sign-light">{i + 1}</span>
                  <span>
                    <span className="block font-semibold">{t}</span>
                    <span className="text-steel">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <Link href="/custom" className="btn btn-primary btn-lg group mt-8">
              Start customizing <ArrowIcon size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Visit */}
      <section className="shell grid gap-10 py-16 sm:py-24 lg:grid-cols-[1fr_1.1fr] lg:gap-16" aria-labelledby="visit-title">
        <div className="flex flex-col">
          <h2 id="visit-title" className="eyebrow not-italic text-stone">
            Visit the store
          </h2>
          <div className="mt-3">
            <AddressBlock />
          </div>
          <p className="mt-6 max-w-md text-lg text-graphite">
            The site shows a slice. The wall shows the rest. Come try on fitteds in your size, see the colours in person, and talk through an embroidery idea face to face.
          </p>
          <div className="mt-6">
            <p className="font-semibold">Hours</p>
            <div className="mt-1">
              <HoursList />
            </div>
          </div>
          <div className="mt-8">
            <StoreActions />
          </div>
          <Link href="/store" className="link mt-5 inline-flex items-center gap-2 self-start font-semibold">
            More about the store <ArrowIcon size={18} />
          </Link>
        </div>
        <RevealImage>
          <MapFrame className="aspect-[4/3] w-full lg:aspect-auto lg:h-full lg:min-h-[28rem]" />
        </RevealImage>
      </section>
    </>
  );
}
