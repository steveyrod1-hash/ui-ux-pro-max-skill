import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BEANIE_PRICE, BEANIE_VIEWS, getTeamBeanie, getTeamBeanies } from "@/lib/team-beanies";
import { SnapbackGallery } from "@/components/snapbacks/SnapbackGallery";
import { money } from "@/lib/format";
import { mapLinks, site } from "@/content/site";
import { InstagramIcon, PhoneIcon, PinIcon } from "@/components/Icons";

export function generateStaticParams() {
  return getTeamBeanies().map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const b = getTeamBeanie(slug);
  if (!b) return { title: "Beanie not found" };
  return { title: b.name, description: `${b.description} At HatWear in Stockton, CA.`, alternates: { canonical: `/beanies/${b.slug}` } };
}

export default async function BeaniePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = getTeamBeanie(slug);
  if (!b) notFound();
  const others = getTeamBeanies().filter((x) => x.slug !== b.slug);
  const views = BEANIE_VIEWS.map((v) => ({ id: v.id, label: v.label, photo: b.photos[v.id] }));

  return (
    <div className="shell pb-24 pt-6 sm:pt-10">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-stone">
        <Link href="/" className="hover:text-ink">Home</Link> / <Link href="/beanies" className="hover:text-ink">Team Beanies</Link> / <span className="text-ink">{b.name}</span>
      </nav>
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <SnapbackGallery name={b.name} views={views} />
        <div>
          <p className="text-sm text-stone">
            {b.league} · {b.team} · {b.pom ? "Pom knit" : "Cuffed knit"}
          </p>
          <h1 className="mt-2 text-[clamp(2.2rem,1.5rem+2.4vw,3.6rem)] uppercase">{b.name}</h1>
          <p className="mt-3 font-display text-3xl font-black tabular-nums" data-testid="beanie-price">
            {BEANIE_PRICE != null ? money(BEANIE_PRICE) : "Ask in store for price"}
          </p>
          <div className="mt-5 rounded-[var(--radius-card)] bg-felt p-5">
            <p className="font-display text-2xl font-black uppercase">Check stock in store</p>
            <p className="mt-1 text-graphite">Call or stop by and HatWear will check this beanie is on the wall for you.</p>
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
          <p className="mt-6 max-w-prose text-[1.05rem] text-graphite">{b.description}</p>
        </div>
      </div>
      {others.length > 0 && (
        <section className="mt-20" aria-labelledby="more-title">
          <h2 id="more-title" className="text-[clamp(2rem,1.5rem+2.4vw,3.4rem)] uppercase">More team beanies</h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {others.map((x) => (
              <li key={x.slug}>
                <Link href={`/beanies/${x.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-ink/20 px-4 text-sm font-medium transition-colors hover:border-ink">{x.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
