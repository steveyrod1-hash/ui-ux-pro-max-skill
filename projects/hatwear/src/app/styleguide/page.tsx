import type { Metadata } from "next";
import { ProductArt, type ArtView } from "@/components/ProductArt";
import { CrownMark, Wordmark } from "@/components/Brand";
import { sampleCatalog } from "@/data/catalog";
import type { ProductType } from "@/data/types";

export const metadata: Metadata = { title: "Style guide", robots: { index: false } };

const VIEWS: ArtView[] = ["front", "side", "back", "detail"];

export default function StyleGuide() {
  // Always the sample catalog: this page is a reference for the illustration system.
  const all = sampleCatalog;
  const types: ProductType[] = ["fitted", "snapback", "trucker", "adjustable", "beanie", "hoodie", "windbreaker"];
  return (
    <main className="shell py-12">
      <div className="flex items-center gap-8">
        <Wordmark className="text-6xl" />
        <CrownMark className="h-16 w-16" />
      </div>
      <div className="stitch my-8 text-ink" />
      {types.map((t) => {
        const p = all.find((x) => x.type === t && x.brand === "HatWear" && x.mark) ?? all.find((x) => x.type === t)!;
        return (
          <section key={t} className="mb-10">
            <h2 className="text-3xl">{t} · {p.name}</h2>
            <div className="mt-3 grid grid-cols-4 gap-3">
              {VIEWS.map((v) => (
                <div key={v} className="aspect-square bg-felt">
                  <ProductArt type={p.type} colors={p.colorways[0].art} mark={p.mark} view={v} className="h-full w-full" />
                </div>
              ))}
            </div>
          </section>
        );
      })}
      <section className="grid grid-cols-6 gap-3">
        {all.slice(0, 24).map((p) => (
          <div key={p.id} className="aspect-square bg-felt">
            <ProductArt type={p.type} colors={p.colorways[p.colorways.length - 1].art} mark={p.mark} className="h-full w-full" />
          </div>
        ))}
      </section>
    </main>
  );
}
