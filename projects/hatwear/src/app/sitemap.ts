import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/catalog";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/shop", "/teams", "/custom", "/store", "/size-guide"].map((p) => ({
    url: `${site.url}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  const products = getAllProducts().map((p) => ({ url: `${site.url}/product/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.6 }));
  return [...pages, ...products];
}
