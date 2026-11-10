import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopView } from "@/components/shop/ShopView";

export const metadata: Metadata = {
  title: "Shop hats, team gear and streetwear",
  description: "Fitted hats, snapbacks, truckers, beanies, MLB, NFL and NBA gear, hoodies and windbreakers from HatWear in Stockton, CA.",
  alternates: { canonical: "/shop" },
};

function ShopSkeleton() {
  return (
    <div className="shell pb-20 pt-14" aria-busy="true" aria-label="Loading products">
      <div className="h-16 w-72 animate-pulse bg-felt" />
      <div className="mt-10 grid grid-cols-2 gap-5 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <div className="aspect-[4/5] animate-pulse bg-felt" />
            <div className="mt-3 h-4 w-3/4 animate-pulse bg-felt" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopView />
    </Suspense>
  );
}
