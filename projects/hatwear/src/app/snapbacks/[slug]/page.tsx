import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassicSnapback, getClassicSnapbacks, SNAP_VIEWS, SNAPBACK_PRICE } from "@/lib/classic-snapbacks";
import { money } from "@/lib/format";
import { SnapbackGallery } from "@/components/snapbacks/SnapbackGallery";
import { mapLinks, site } from "@/content/site";
import { InstagramIcon, PhoneIcon, PinIcon } from "@/components/Icons";

export function generateStaticParams() {
  return getClassicSnapbacks().map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const h = getClassicSnapback(slug);
  if (!h) return { title: "Hat not found" };
  return {
    title: h.name,
    description: `${h.name}: flat-brim adjustable snapback (${h.league}), ${money(SNAPBACK_PRICE)}, at HatWear in Stockton, CA.`,
    alternates: { canonical: `/snapbacks/${h.slug}` },
  };
}

export default async function SnapbackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const h = getClassicSnapback(slug);
  if (!h) notFound();
  const others = getClassicSnapbacks().filter((x) => x.league === h.league && x.slug !== h.slug);
  const views = SNAP_VIEWS.map((v) => ({ id: v.id, label: v.label, photo: h.photos[v.id] }));
  const missingLabels = SNAP_VIEWS.filter((v) => h.missing.includes(v.id)).map((v) => v.label);

  return (
    <div className="shell pb-24 pt-6 sm:pt-10">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-stone">
        <Link href="/" className="hover:text-ink">Home</Link> /{" "}
        <Link href="/snapbacks" className="hover:text-ink">Classic Snapbacks</Link> / <span className="text-ink">{h.team}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <SnapbackGallery name={h.name} views={views} />
        <div>
          <p className="text-sm text-stone">
            {h.league} · Classic snapback ·{" "}
            <Link href={`/snapbacks?league=${h.league}`} className="hover:text-ink hover:underline">
              More {h.league} teams
            </Link>
          </p>
          <h1 className="mt-2 text-[clamp(2.2rem,1.5rem+2.4vw,3.6rem)] uppercase">{h.name}</h1>
          <p className="mt-3 font-display text-4xl font-black tabular-nums" data-testid="snap-price">{money(SNAPBACK_PRICE)}</p>

          <div className="mt-5 rounded-[var(--radius-card)] bg-felt p-5" data-testid="price-panel">
            <p className="font-display text-2xl font-black uppercase">Check stock in store</p>
            <p className="mt-1 text-graphite">Call or stop by and HatWear will check this team is on the wall for you.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a href={`tel:${site.phone.tel}`} className="btn btn-primary">
                <PhoneIcon size={18} /> Call {site.phone.display}
              </a>
              <a href={mapLinks.google} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-ghost-dark">
                <PinIcon size={18} /> Directions
              </a>
            </div>
            <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink hover:underline">
              <InstagramIcon size={18} /> Message @{site.instagram.handle}
            </a>
          </div>

          <p className="mt-6 max-w-prose text-[1.05rem] text-graphite">
            A classic {h.team} snapback: structured crown, flat brim and an adjustable snap closure at the back.
          </p>

          <div className="mt-8 border-t border-ink/15 pt-5">
            <h2 className="font-display text-xl font-extrabold not-italic uppercase tracking-wide">Photos</h2>
            <ul className="mt-3 space-y-1.5 text-graphite">
              {SNAP_VIEWS.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 border-b border-ink/8 pb-1.5">
                  <span>{v.label}</span>
                  <span className={`text-sm font-semibold ${h.photos[v.id] ? "text-ok" : "text-stone"}`}>{h.photos[v.id] ? "Photo" : "Coming soon"}</span>
                </li>
              ))}
            </ul>
            {missingLabels.length > 0 && <p className="mt-3 text-sm text-stone">Real photos of this exact hat are being added. Until then, the store can show it to you in person.</p>}
          </div>
        </div>
      </div>

      <section className="mt-20" aria-labelledby="more-title">
        <h2 id="more-title" className="text-[clamp(2rem,1.5rem+2.4vw,3.4rem)] uppercase">
          More {h.league} snapbacks
        </h2>
        <ul className="mt-6 flex flex-wrap gap-2">
          {others.map((x) => (
            <li key={x.slug}>
              <Link href={`/snapbacks/${x.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-ink/20 px-4 text-sm font-medium transition-colors hover:border-ink">
                {x.team}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
