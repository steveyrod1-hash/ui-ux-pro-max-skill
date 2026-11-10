import Link from "next/link";
import { Wordmark } from "./Brand";
import { InstagramIcon, PhoneIcon, PinIcon } from "./Icons";
import { DEMO_CATALOG, fullAddress, mapLinks, site } from "@/content/site";

const COLS = [
  {
    title: "Shop",
    links: [
      ["All headwear", "/shop"],
      ["Fitted hats", "/shop?type=fitted"],
      ["Snapbacks", "/shop?type=snapback"],
      ["Truckers", "/shop?type=trucker"],
      ["Beanies", "/shop?type=beanie"],
      ["Streetwear", "/shop?type=hoodie,windbreaker"],
    ],
  },
  {
    title: "Teams",
    links: [
      ["MLB", "/teams?league=MLB"],
      ["NFL", "/teams?league=NFL"],
      ["NBA", "/teams?league=NBA"],
    ],
  },
  {
    title: "HatWear",
    links: [
      ["Custom embroidery", "/custom"],
      ["Our store", "/store"],
      ["Fitted size guide", "/size-guide"],
      ["Wishlist", "/wishlist"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="twill mt-auto bg-ink text-bone">
      <div className="shell grid gap-10 py-14 md:grid-cols-[1.4fr_2fr] md:py-20">
        <div>
          <Link href="/" className="text-4xl" aria-label="HatWear home">
            <Wordmark tone="bone" />
          </Link>
          <p className="mt-4 max-w-sm text-bone/70">{site.tagline}</p>
          <ul className="mt-6 space-y-2.5">
            <li>
              <a href={mapLinks.google} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2.5 hover:text-white">
                <PinIcon size={18} className="mt-0.5 shrink-0 text-red" />
                {fullAddress}
              </a>
            </li>
            <li>
              <a href={`tel:${site.phone.tel}`} className="inline-flex items-center gap-2.5 hover:text-white">
                <PhoneIcon size={18} className="shrink-0 text-red" />
                {site.phone.display}
              </a>
            </li>
            <li>
              <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 hover:text-white">
                <InstagramIcon size={18} className="shrink-0 text-red" />@{site.instagram.handle}
              </a>
            </li>
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <p className="font-display text-xl font-bold uppercase tracking-wide">{c.title}</p>
              <ul className="mt-3 space-y-1">
                {c.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="inline-block py-1 text-bone/70 hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="stitch-wrap shell">
        <div className="stitch text-bone/40" aria-hidden="true" />
      </div>
      <div className="shell flex flex-col gap-2 py-6 text-sm text-bone/55 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} HatWear, Stockton, California.</p>
        {DEMO_CATALOG && <p>Preview site: products, prices and stock shown are samples, not current inventory.</p>}
      </div>
    </footer>
  );
}
