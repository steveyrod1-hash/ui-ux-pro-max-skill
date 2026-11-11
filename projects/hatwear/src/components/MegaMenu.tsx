"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { STYLE_GROUPS, STYLES, type StyleGroup } from "@/data/styles";
import { LEAGUES, TEAMS_BY_LEAGUE, styleCounts, teamCounts } from "@/lib/catalog";
import { TEAM_CODES } from "@/data/catalog";
import type { ArtColors, ProductType } from "@/data/types";
import { ProductArt } from "./ProductArt";
import { ArrowIcon } from "./Icons";

const NAVY: ArtColors = { crown: "#1d3557", visor: "#1d3557", under: "#2a3a52", button: "#1d3557", mark: "#ffffff", trim: "#ffffff" };

export const GROUP_LINKS: Record<StyleGroup, { href: string; art: ProductType; mark: string }> = {
  caps: { href: "/shop?type=fitted,snapback,trucker,adjustable", art: "fitted", mark: "HW" },
  beanies: { href: "/shop?type=beanie", art: "beanie", mark: "HW" },
  hats: { href: "/shop?type=bucket", art: "bucket", mark: "HW" },
  apparel: { href: "/shop?type=hoodie,windbreaker", art: "hoodie", mark: "HW" },
};

const panel = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8, transition: { duration: 0.12 } },
  transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] as const },
};

export function ShopMenu({ onNavigate, id }: { onNavigate: () => void; id: string }) {
  const counts = styleCounts();
  return (
    <motion.div {...panel} id={id} className="absolute inset-x-0 top-full z-40 border-b-2 border-ink bg-bone shadow-[0_24px_48px_-24px_rgba(19,35,58,.35)]">
      <div className="shell grid grid-cols-[repeat(4,minmax(0,1fr))_17rem] gap-8 py-8">
        {STYLE_GROUPS.map((g) => {
          const link = GROUP_LINKS[g.id];
          return (
            <div key={g.id}>
              <Link href={link.href} onClick={onNavigate} className="group flex items-center gap-3">
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-felt">
                  <ProductArt type={link.art} colors={NAVY} mark={link.mark} className="size-12" shadow={false} />
                </span>
                <span>
                  <span className="block font-display text-xl font-black uppercase group-hover:text-sign">{g.label}</span>
                  <span className="block text-xs text-stone">{g.blurb}</span>
                </span>
              </Link>
              <ul className="mt-4 space-y-0.5 border-t border-ink/15 pt-3">
                {STYLES.filter((s) => s.group === g.id).map((s) => (
                  <li key={s.id}>
                    <Link href={`/shop?style=${s.id}`} onClick={onNavigate} className="flex items-center justify-between rounded-sm px-2 py-1.5 text-[0.95rem] hover:bg-felt">
                      <span>{s.label}</span>
                      {counts[s.id] ? <span className="text-xs tabular-nums text-stone">{counts[s.id]}</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        <div className="flex flex-col justify-between bg-ink p-5 text-bone twill">
          <div>
            <p className="font-display text-2xl font-black uppercase leading-tight">Design your own</p>
            <p className="mt-2 text-sm text-bone/75">Your text or logo, stitched in the shop on our Tajima. From $7.99.</p>
          </div>
          <ProductArt type="fitted" view="detail" colors={NAVY} embroidery={{ placement: "front", text: "209", thread: "#9cc0ff" }} className="my-3 aspect-square w-full" />
          <Link href="/custom" onClick={onNavigate} className="btn bg-white text-ink hover:bg-chalk">
            Start customizing
          </Link>
        </div>
      </div>
      <div className="shell flex items-center justify-between border-t border-ink/10 py-3 text-sm">
        <Link href="/shop" onClick={onNavigate} className="link inline-flex items-center gap-2 font-semibold">
          Shop everything <ArrowIcon size={16} />
        </Link>
        <span className="flex items-center gap-6">
          <Link href="/deals" onClick={onNavigate} className="link font-semibold text-sign-deep">
            Limited-time deals
          </Link>
          <Link href="/size-guide" onClick={onNavigate} className="link font-semibold">
            Fitted size guide
          </Link>
        </span>
      </div>
    </motion.div>
  );
}

export function TeamsMenu({ onNavigate, id }: { onNavigate: () => void; id: string }) {
  const counts = teamCounts();
  return (
    <motion.div {...panel} id={id} className="absolute inset-x-0 top-full z-40 border-b-2 border-ink bg-bone shadow-[0_24px_48px_-24px_rgba(19,35,58,.35)]">
      <div className="shell grid grid-cols-3 gap-10 py-8">
        {LEAGUES.map((l) => (
          <div key={l}>
            <Link href={`/shop?league=${l}`} onClick={onNavigate} className="font-display text-2xl font-black uppercase hover:text-sign">
              {l}
            </Link>
            <ul className="mt-3 space-y-0.5 border-t border-ink/15 pt-3">
              {TEAMS_BY_LEAGUE[l].map((t) => (
                <li key={t}>
                  <Link href={`/shop?team=${encodeURIComponent(t)}`} onClick={onNavigate} className="grid grid-cols-[3.2rem_1fr_auto] items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-felt">
                    <span className="font-display text-sm font-black text-stone">{TEAM_CODES[t]}</span>
                    <span>{t}</span>
                    {counts[t] ? <span className="text-xs tabular-nums text-stone">{counts[t]}</span> : <span />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="shell border-t border-ink/10 py-3 text-sm">
        <Link href="/teams" onClick={onNavigate} className="link inline-flex items-center gap-2 font-semibold">
          Browse all teams <ArrowIcon size={16} />
        </Link>
      </div>
    </motion.div>
  );
}
