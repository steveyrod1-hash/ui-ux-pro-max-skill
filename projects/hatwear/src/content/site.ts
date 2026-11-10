/**
 * Business facts and owner-editable content.
 *
 * Everything customers read about the store comes from this file, so the
 * owner (or whoever maintains the site) can update it without touching
 * components. Only facts supplied by the business are filled in; anything
 * still unverified is `null` and the UI falls back to "call to confirm".
 */

export const site = {
  name: "HatWear",
  tagline: "Find your fit. Rep your team. Make it yours.",
  description:
    "HatWear is a sports hat and headwear store in Stockton, California: MLB, NFL and NBA fitteds and snapbacks, beanies, truckers, streetwear and custom embroidery.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  address: {
    street: "5340 W Yokuts Ave",
    city: "Stockton",
    region: "CA",
    postalCode: "95207",
    country: "US",
  },
  phone: { display: "(209) 688-3466", tel: "+12096883466" },
  instagram: { handle: "hatwear209", url: "https://www.instagram.com/hatwear209/" },

  /**
   * Opening hours. `null` until the store confirms them.
   * Example once verified:
   *   [{ days: "Mon–Sat", opens: "10:00", closes: "19:00" }, { days: "Sun", opens: "11:00", closes: "17:00" }]
   * For structured data, also fill `hoursSchema` with schema.org day names.
   */
  hours: null as null | { days: string; opens: string; closes: string }[],
  hoursSchema: null as null | { dayOfWeek: string[]; opens: string; closes: string }[],

  /** Store photos live in /public/store/. Empty until the business supplies them. */
  storePhotos: [] as { src: string; alt: string }[],
} as const;

export const fullAddress = `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`;

const q = encodeURIComponent(`HatWear, ${fullAddress}`);
export const mapLinks = {
  google: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
  apple: `https://maps.apple.com/?daddr=${q}`,
  embed: `https://www.google.com/maps?q=${q}&output=embed`,
};

/**
 * Announcement bar. Only list messages that are true today.
 * Never add a promotion the store is not actually running.
 */
export const announcements: { id: string; text: string; href?: string; cta?: string }[] = [
  {
    id: "embroidery",
    text: "Custom embroidery on hats and apparel, done for you in Stockton.",
    href: "/custom",
    cta: "Start a request",
  },
  {
    id: "visit",
    text: "A whole wall of styles to try on at 5340 W Yokuts Ave.",
    href: "/store",
    cta: "Plan a visit",
  },
  {
    id: "instagram",
    text: "Follow the store for new arrivals and drops.",
    href: "https://www.instagram.com/hatwear209/",
    cta: "@hatwear209",
  },
];

/**
 * Embroidery pricing. Previously advertised as "from $7.99", but that figure
 * has not been re-confirmed, so it is not shown. Set `startingPrice` (and the
 * per-unit rules below) once the store confirms current pricing; the studio
 * then shows an estimate instead of "Request a quote".
 */
export const embroideryPricing = {
  verified: false,
  startingPrice: null as number | null,
  /** Optional add-ons, applied per item, once verified. */
  extraPlacement: null as number | null,
  customArtworkSetup: null as number | null,
};

/** While true, every product, price and stock level is sample data. */
export const DEMO_CATALOG = true;

/** While true, checkout never charges or submits an order. */
export const DEMO_CHECKOUT = true;
