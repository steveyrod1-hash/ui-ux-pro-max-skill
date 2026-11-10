import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site, fullAddress } from "@/content/site";
import { AddressBlock, HoursList, MapFrame, StoreActions } from "@/components/StoreVisit";
import { ProductArt } from "@/components/ProductArt";
import { RevealImage } from "@/components/Reveal";
import { ArrowIcon, InstagramIcon } from "@/components/Icons";
import { CrownMark } from "@/components/Brand";

export const metadata: Metadata = {
  title: "Our store: 5340 W Yokuts Ave, Stockton",
  description: `Visit HatWear at ${fullAddress}. Try on fitted hats, browse team gear and talk through custom embroidery in person. Call ${site.phone.display}.`,
  alternates: { canonical: "/store" },
};

const REASONS = [
  ["Try the fit", "Fitted sizing is personal. Put a few on and feel the difference between a 7 1/4 and a 7 3/8."],
  ["See the colours", "Thread, felt and twill look different in daylight than on a screen."],
  ["Talk embroidery", "Bring the hat, the idea or the logo, and work out placement and thread at the counter."],
];

/** Placeholder frames shown until the store supplies real photography. */
const PHOTO_SLOTS = [
  { label: "Storefront", span: "md:col-span-2 md:row-span-2" },
  { label: "The hat wall", span: "" },
  { label: "Embroidery station", span: "" },
  { label: "Team section", span: "" },
  { label: "Counter", span: "" },
];

export default function StorePage() {
  const photos = site.storePhotos;
  return (
    <div className="pb-24">
      <section className="twill bg-ink text-bone">
        <div className="shell grid items-end gap-10 py-14 sm:py-20 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-bone/70">Our store · Stockton, California</p>
            <h1 className="mt-3 text-[clamp(3.4rem,1.6rem+8vw,9.5rem)] uppercase leading-[0.84]">
              Come see
              <br />
              the wall
            </h1>
            <p className="mt-6 max-w-xl text-lg text-bone/80">
              HatWear is a sports hat and streetwear shop inside Sherwood Place, next to Macy's and Dick's Sporting Goods: fitted caps, snapbacks, truckers, beanies, team gear, hoodies and custom embroidery under one roof.
            </p>
          </div>
          <div className="space-y-6">
            <AddressBlock dark />
            <StoreActions dark />
          </div>
        </div>
      </section>

      <section className="shell grid gap-6 py-14 sm:py-20 md:grid-cols-3" aria-label="Why visit">
        {REASONS.map(([t, d]) => (
          <div key={t} className="border-t-2 border-ink pt-5">
            <h2 className="text-[2.2rem] uppercase">{t}</h2>
            <p className="mt-2 text-graphite">{d}</p>
          </div>
        ))}
      </section>

      <section className="shell" aria-labelledby="gallery-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="gallery-title" className="text-[clamp(2.2rem,1.6rem+3vw,4rem)] uppercase">
            Inside the shop
          </h2>
          <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-2 font-semibold">
            <InstagramIcon size={18} /> More on @{site.instagram.handle}
          </a>
        </div>
        {photos.length > 0 ? (
          <div className="mt-6 grid auto-rows-[14rem] grid-cols-2 gap-3 md:grid-cols-4">
            {photos.map((p, i) => (
              <RevealImage key={p.src} delay={i * 0.05} className={`relative overflow-hidden ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
                <Image src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
              </RevealImage>
            ))}
          </div>
        ) : (
          <>
            <div className="mt-6 grid auto-rows-[11rem] grid-cols-2 gap-3 sm:auto-rows-[14rem] md:grid-cols-4">
              {PHOTO_SLOTS.map((s, i) => (
                <RevealImage key={s.label} delay={i * 0.05} className={`relative overflow-hidden ${i === 0 ? "col-span-2 row-span-2" : ""} ${s.span}`}>
                  <div className={`flex size-full flex-col justify-between p-4 ${i === 0 ? "twill bg-charcoal text-bone" : "twill-light bg-felt"}`}>
                    <CrownMark className="size-8 opacity-60" tone={i === 0 ? "bone" : "ink"} />
                    {i === 0 && (
                      <ProductArt
                        type="fitted"
                        mark="HW"
                        colors={{ crown: "#1c1b1a", visor: "#1c1b1a", under: "#2a2a2a", button: "#1c1b1a", mark: "#d2261c" }}
                        className="mx-auto w-1/2 opacity-90"
                      />
                    )}
                    <p className="text-sm font-semibold">
                      {s.label}
                      <span className="block font-normal opacity-60">Photo coming soon</span>
                    </p>
                  </div>
                </RevealImage>
              ))}
            </div>
            <p className="mt-3 text-sm text-stone">These frames are placeholders. Real photos of the store go here once HatWear supplies them.</p>
          </>
        )}
      </section>

      <section className="shell grid gap-10 py-16 sm:py-24 lg:grid-cols-[1fr_1.3fr]" aria-labelledby="find-title">
        <div>
          <h2 id="find-title" className="text-[clamp(2.2rem,1.6rem+3vw,4rem)] uppercase">
            Hours and directions
          </h2>
          <div className="mt-6 space-y-6">
            <div>
              <p className="font-semibold">Address</p>
              <p className="text-graphite">{fullAddress}</p>
            </div>
            <div>
              <p className="font-semibold">Phone</p>
              <a href={`tel:${site.phone.tel}`} className="link text-lg font-semibold">
                {site.phone.display}
              </a>
            </div>
            <div>
              <p className="font-semibold">Hours</p>
              <div className="mt-1">
                <HoursList />
              </div>
            </div>
          </div>
          <div className="mt-8">
            <StoreActions />
          </div>
        </div>
        <MapFrame className="aspect-[4/3] w-full lg:aspect-auto lg:min-h-[30rem]" />
      </section>

      <section className="shell">
        <div className="twill flex flex-col items-start justify-between gap-6 bg-red p-8 text-white sm:flex-row sm:items-center sm:p-12">
          <p className="max-w-xl font-display text-[clamp(2rem,1.4rem+2.6vw,3.4rem)] font-black uppercase leading-[0.92]">
            Got an embroidery idea? Start it online, finish it at the counter.
          </p>
          <Link href="/custom" className="btn shrink-0 bg-ink text-bone hover:bg-charcoal">
            Start customizing <ArrowIcon size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
