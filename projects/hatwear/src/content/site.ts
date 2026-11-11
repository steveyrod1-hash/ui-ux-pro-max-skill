import { IS_LIVE_CATALOG } from "@/lib/catalog";
import { cloverPublic } from "@/lib/clover/config";

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
    "HatWear is a sports hat and headwear store inside Sherwood Place in Stockton, California, next to Macy's and Dick's Sporting Goods: MLB, NFL and NBA fitteds and snapbacks, beanies, hoodies, streetwear and custom embroidery from $7.99.",
  /** Official address. Preview deployments also point here so search engines index one site. */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://hatwear209.vercel.app"),

  address: {
    street: "5340 W Yokuts Ave",
    city: "Stockton",
    region: "CA",
    postalCode: "95207",
    country: "US",
  },
  /** Where to find the store, as listed on Google and Instagram. */
  locatedIn: "Sherwood Place",
  landmark: "Next to Macy's and Dick's Sporting Goods",
  phone: { display: "(209) 688-3466", tel: "+12096883466" },
  instagram: { handle: "hatwear209", url: "https://www.instagram.com/hatwear209/" },

  /**
   * Opening hours, from the store's Google Business listing (November 2026).
   * Holidays can differ; the site says so next to the hours.
   */
  hours: [
    { days: "Monday to Friday", opens: "11:00", closes: "19:00" },
    { days: "Saturday", opens: "11:00", closes: "20:00" },
    { days: "Sunday", opens: "11:00", closes: "19:00" },
  ] as null | { days: string; opens: string; closes: string }[],
  /** Same hours in schema.org form, plus a per-weekday table for "open now". 0 = Sunday. */
  hoursSchema: [
    { dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "11:00", closes: "19:00" },
    { dayOfWeek: ["Saturday"], opens: "11:00", closes: "20:00" },
    { dayOfWeek: ["Sunday"], opens: "11:00", closes: "19:00" },
  ] as null | { dayOfWeek: string[]; opens: string; closes: string }[],
  weeklyHours: { 0: ["11:00", "19:00"], 1: ["11:00", "19:00"], 2: ["11:00", "19:00"], 3: ["11:00", "19:00"], 4: ["11:00", "19:00"], 5: ["11:00", "19:00"], 6: ["11:00", "20:00"] } as Record<number, [string, string]>,
  timeZone: "America/Los_Angeles",

  /** Store photos live in /public/store/. Empty until the business supplies them. */
  storePhotos: [
    { src: "/store/tajima-machine.jpg", alt: "The Tajima embroidery machine in the shop, loaded with Madeira thread, with team caps on the wall behind it" },
    { src: "/store/thread-wall.jpg", alt: "A shelf of Madeira embroidery thread cones in navy, red, gold, green, pink and more" },
    { src: "/store/embroidery-station.jpg", alt: "The embroidery station: the Tajima machine with thread cones beside it" },
    { src: "/store/embroidery-bench.jpg", alt: "The embroidery bench with thread cones, machine oil and stitched backing paper" },
  ] as { src: string; alt: string }[],
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
    text: "Custom embroidery from $7.99, done in store.",
    href: "/custom",
    cta: "Start a request",
  },
  {
    id: "visit",
    text: "Find us inside Sherwood Place, next to Macy's and Dick's.",
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
 * Embroidery pricing. The store currently advertises "starting low as $7.99"
 * on Instagram, so the site shows that as a starting price and every request
 * still gets an exact quote. Set `verified` and the per-unit rules below to
 * switch the studio from "Request a quote" to a calculated estimate.
 */
export const embroideryPricing = {
  /** "Starting low as $7.99", as advertised on @hatwear209 (November 2026). Shown as a starting price only. */
  advertisedFrom: 7.99 as number | null,
  /** Set true (with per-item rules) to let the studio calculate full estimates. */
  verified: false,
  startingPrice: null as number | null,
  /** Optional add-ons, applied per item, once verified. */
  extraPlacement: null as number | null,
  customArtworkSetup: null as number | null,
};

/** True while products, prices and stock are sample data (no Clover catalog synced). */
export const DEMO_CATALOG = !IS_LIVE_CATALOG;

/** True while online payment isn't connected (no Clover public key). */
export const DEMO_CHECKOUT = !cloverPublic.enabled;
