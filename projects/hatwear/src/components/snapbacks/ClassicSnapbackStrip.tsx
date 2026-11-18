"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { money } from "@/lib/format";
import { ArrowIcon } from "../Icons";
import type { SnapCard } from "./SnapbackGrid";
import { PhotoPlaceholder } from "./SnapbackGallery";

/** The real Classic Snapback collection, shown in the shop whenever Snapbacks are selected. */
export function ClassicSnapbackStrip({ hats, price, league = [], q = "" }: { hats: SnapCard[]; price: number; league?: string[]; q?: string }) {
  const needle = q.trim().toLowerCase();
  const shown = hats.filter((h) => (!league.length || league.includes(h.league)) && (!needle || h.team.toLowerCase().includes(needle)));
  const [all, setAll] = useState(false);
  if (!shown.length) return null;
  const LIMIT = 10;
  const list = all ? shown : shown.slice(0, LIMIT);

  return (
    <section className="mb-10" aria-labelledby="classic-snap-title" data-testid="shop-snapbacks">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-stone">In store now · {money(price)} each</p>
          <h2 id="classic-snap-title" className="mt-1 text-[clamp(1.8rem,1.3rem+2vw,2.8rem)] uppercase">
            Classic team snapbacks
          </h2>
        </div>
        <Link href="/snapbacks" className="group inline-flex min-h-11 items-center gap-2 font-semibold">
          All {hats.length} teams <ArrowIcon size={18} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:gap-5 2xl:grid-cols-5">
        {list.map((h) => (
          <li key={h.slug}>
            <Link href={`/snapbacks/${h.slug}`} className="card card-lift group flex h-full flex-col overflow-hidden">
              <span className="relative block aspect-square bg-white">
                {h.front ? <Image src={h.front.src} alt={h.front.alt} fill sizes="(min-width: 1024px) 22vw, 46vw" className="object-contain" /> : <PhotoPlaceholder label="Front" small />}
                <span className="label absolute left-2.5 top-2.5">{h.league}</span>
              </span>
              <span className="flex flex-1 flex-col p-3 sm:p-4">
                <span className="text-[0.76rem] text-stone">{h.league} · Snapback</span>
                <span className="mt-0.5 font-bold leading-snug group-hover:underline">{h.team} Classic Snapback</span>
                <span className="mt-auto pt-1.5 font-semibold tabular-nums">{money(price)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {shown.length > LIMIT && !all && (
        <button type="button" onClick={() => setAll(true)} className="btn btn-ghost btn-ghost-dark mt-5 w-full sm:w-auto">
          Show all {shown.length} teams
        </button>
      )}
    </section>
  );
}
