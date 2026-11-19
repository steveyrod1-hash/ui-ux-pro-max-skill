import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/catalog";
import { getClassicSnapbacks } from "@/lib/classic-snapbacks";
import { getTeamBeanies } from "@/lib/team-beanies";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/shop", "/snapbacks", "/beanies", "/teams", "/custom", "/store", "/size-guide"].map((p) => ({
    url: `${site.url}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  const products = getAllProducts().map((p) => ({ url: `${site.url}/product/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.6 }));
  const snapbacks = getClassicSnapbacks().map((h) => ({ url: `${site.url}/snapbacks/${h.slug}`, changeFrequency: "weekly" as const, priority: 0.6 }));
  const beanies = getTeamBeanies().map((b) => ({ url: `${site.url}/beanies/${b.slug}`, changeFrequency: "weekly" as const, priority: 0.6 }));
  return [...pages, ...products, ...snapbacks, ...beanies];
}
