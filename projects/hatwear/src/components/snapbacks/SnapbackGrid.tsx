"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SearchIcon } from "../Icons";
import { money } from "@/lib/format";
import { PhotoPlaceholder } from "./SnapbackGallery";

export type SnapCard = { slug: string; team: string; league: "MLB" | "NFL"; front: { src: string; alt: string } | null; photoCount: number; name?: string };

const TABS = ["All", "MLB", "NFL"] as const;

export function SnapbackGrid({ hats, price, basePath = "/snapbacks", kind = "Classic snapback", tabs = true }: { hats: SnapCard[]; price: number | null; basePath?: string; kind?: string; tabs?: boolean }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [q, setQ] = useState("");
  // Deep link: /snapbacks?league=NFL
  useEffect(() => {
    const l = new URLSearchParams(window.location.search).get("league")?.toUpperCase();
    if (l === "MLB" || l === "NFL") setTab(l);
  }, []);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return hats.filter((h) => (tab === "All" || h.league === tab) && (!needle || `${h.team} ${h.name ?? ""}`.toLowerCase().includes(needle)));
  }, [hats, tab, q]);
  const count = (t: (typeof TABS)[number]) => (t === "All" ? hats.length : hats.filter((h) => h.league === t).length);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        {tabs && (
        <div className="grid w-full grid-cols-3 rounded-[var(--radius-btn)] bg-felt p-1 sm:inline-flex sm:w-auto" role="tablist" aria-label="League">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`min-h-11 whitespace-nowrap rounded-[calc(var(--radius-btn)-2px)] px-2 font-display text-[0.9rem] font-extrabold uppercase tracking-wide transition-colors sm:px-5 sm:text-[0.95rem] ${
                tab === t ? "bg-ink text-bone" : "text-graphite hover:text-ink"
              }`}
            >
              {t} <span className={`ml-1 text-xs font-semibold ${tab === t ? "text-steel" : "text-stone"}`}>{count(t)}</span>
            </button>
          ))}
        </div>
        )}
        <label className="flex min-h-11 w-full items-center gap-2 border-b-2 border-ink sm:w-72">
          <SearchIcon size={20} className="shrink-0 text-stone" />
          <span className="sr-only">Search teams</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a team" className="min-w-0 flex-1 bg-transparent py-2 focus:outline-none" />
        </label>
      </div>

      <p className="mt-5 text-sm text-stone" aria-live="polite" data-testid="snap-count">
        {shown.length} {shown.length === 1 ? "team" : "teams"}
      </p>

      {shown.length === 0 ? (
        <p className="mt-6 rounded-[var(--radius-card)] bg-felt px-6 py-14 text-center text-graphite">No team matches “{q}”. Try another name.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5">
          {shown.map((h) => (
            <li key={h.slug}>
              <Link href={`${basePath}/${h.slug}`} className="card card-lift group flex h-full flex-col overflow-hidden" data-testid="snap-card">
                <span className="relative block aspect-square bg-white">
                  {h.front ? <Image src={h.front.src} alt={h.front.alt} fill sizes="(min-width: 1280px) 18vw, (min-width: 640px) 30vw, 46vw" className="object-contain p-[4%]" /> : <PhotoPlaceholder label="Front" small />}
                  <span className="label absolute left-2.5 top-2.5">{h.league}</span>
                </span>
                <span className="flex flex-1 flex-col p-3 sm:p-4">
                  <span className="text-[0.76rem] text-stone">{kind}</span>
                  <span className="mt-0.5 font-bold leading-snug group-hover:underline">{h.name ?? h.team}</span>
                  <span className="mt-auto flex items-baseline justify-between gap-2 pt-1.5">
                    <span className="font-semibold tabular-nums">{price != null ? money(price) : "Ask in store"}</span>
                    <span className="text-[0.76rem] text-stone">{h.photoCount === 4 ? "4 photos" : `${h.photoCount}/4 photos`}</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
