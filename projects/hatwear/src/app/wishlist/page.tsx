"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { getProductById } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { HeartIcon } from "@/components/Icons";

export default function WishlistPage() {
  const { wishlist, hydrated } = useStore();
  const items = wishlist.flatMap((id) => {
    const p = getProductById(id);
    return p ? [p] : [];
  });

  return (
    <div className="shell pb-24 pt-10 sm:pt-14">
      <title>Wishlist | HatWear Stockton</title>
      <h1 className="text-[clamp(2.8rem,1.6rem+5vw,6rem)] uppercase">Wishlist</h1>
      <p className="mt-2 text-graphite">Saved on this device. Bring it up at the counter when you visit.</p>
      {!hydrated ? (
        <div className="mt-10 h-40 animate-pulse bg-felt" aria-busy="true" />
      ) : items.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-sm bg-felt px-6 py-20 text-center">
          <HeartIcon size={40} className="text-ink/30" />
          <p className="mt-4 font-display text-4xl font-black uppercase">Nothing saved yet</p>
          <p className="mt-2 text-graphite">Tap the heart on any hat to keep it here.</p>
          <Link href="/shop" className="btn btn-dark mt-6">
            Browse the wall
          </Link>
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {items.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
