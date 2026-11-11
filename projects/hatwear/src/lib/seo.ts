import { fullAddress, site } from "@/content/site";
import type { Product } from "@/data/types";
import { unitsFor } from "./catalog";
import { priceFor } from "./deals";

/** schema.org Store markup. Hours are only included once verified in site.ts. */
export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "@id": `${site.url}/#store`,
    name: site.name,
    description: site.description,
    url: site.url,
    telephone: site.phone.tel,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`,
    sameAs: [site.instagram.url],
    ...(site.hoursSchema
      ? {
          openingHoursSpecification: site.hoursSchema.map((h) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: h.dayOfWeek,
            opens: h.opens,
            closes: h.closes,
          })),
        }
      : {}),
  };
}

export function productJsonLd(p: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    brand: { "@type": "Brand", name: p.brand },
    sku: p.id,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: priceFor(p).price.toFixed(2),
      availability: unitsFor(p) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${site.url}/product/${p.slug}`,
      seller: { "@id": `${site.url}/#store` },
    },
  };
}
