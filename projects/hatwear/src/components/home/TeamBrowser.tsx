"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { League } from "@/data/types";
import { ArrowIcon } from "../Icons";

export function TeamBrowser({
  leagues,
  teams,
  counts,
  codes,
  initial = "MLB",
}: {
  leagues: League[];
  teams: Record<League, string[]>;
  counts: Record<string, number>;
  codes: Record<string, string>;
  initial?: League;
}) {
  const [league, setLeague] = useState<League>(initial);
  return (
    <div>
      <div role="tablist" aria-label="League" className="inline-flex gap-1 rounded-sm bg-felt p-1">
        {leagues.map((l) => (
          <button
            key={l}
            role="tab"
            id={`tab-${l}`}
            aria-selected={league === l}
            aria-controls={`panel-${l}`}
            onClick={() => setLeague(l)}
            onKeyDown={(e) => {
              const i = leagues.indexOf(l);
              if (e.key === "ArrowRight") setLeague(leagues[(i + 1) % leagues.length]);
              if (e.key === "ArrowLeft") setLeague(leagues[(i - 1 + leagues.length) % leagues.length]);
            }}
            tabIndex={league === l ? 0 : -1}
            className={`relative h-11 min-w-20 px-5 font-display text-xl font-extrabold tracking-wide transition-colors ${league === l ? "text-bone" : "text-ink/70 hover:text-ink"}`}
          >
            {league === l && <motion.span layoutId="league-pill" className="absolute inset-0 rounded-[2px] bg-ink" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
            <span className="relative">{l}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 min-h-[22rem]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul
            key={league}
            id={`panel-${league}`}
            role="tabpanel"
            aria-labelledby={`tab-${league}`}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.045 } } }}
            className="border-t-2 border-ink"
          >
            {teams[league].map((t) => (
              <motion.li key={t} variants={{ hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0 } }}>
                <Link
                  href={`/shop?team=${encodeURIComponent(t)}`}
                  className="group grid grid-cols-[3.6rem_1fr_auto] items-center gap-4 border-b border-ink/15 py-3.5 transition-colors hover:bg-felt sm:grid-cols-[5rem_1fr_auto_auto] sm:py-4"
                >
                  <span className="font-display text-[1.7rem] font-black leading-none text-stone transition-colors group-hover:text-red sm:text-[2.2rem]">
                    {codes[t]}
                  </span>
                  <span className="font-display text-[1.55rem] font-extrabold uppercase leading-none tracking-wide sm:text-[2.2rem]">{t}</span>
                  <span className="hidden text-sm text-stone sm:block">{counts[t] ?? 0} styles</span>
                  <ArrowIcon size={22} className="mr-1 text-ink/40 transition-transform group-hover:translate-x-1 group-hover:text-ink" />
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        </AnimatePresence>
        <Link href={`/shop?league=${league}`} className="link mt-5 inline-flex items-center gap-2 font-semibold">
          Everything {league} <ArrowIcon size={18} />
        </Link>
      </div>
    </div>
  );
}
