"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { announcements as baseAnnouncements } from "@/content/site";
import { activeDeals } from "@/lib/deals";
import { useNow } from "@/lib/use-now";
import { ChevronIcon, CloseIcon, PauseIcon, PlayIcon } from "./Icons";

const ROTATE_MS = 6000;

export function AnnouncementBar() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();
  const deals = activeDeals(useNow());
  const best = deals.length ? Math.max(...deals.map((d) => d.percentOff)) : 0;
  const announcements = deals.length
    ? [baseAnnouncements[0], { id: "deals", text: `Limited-time deals: up to ${best}% off hats and hoodies.`, href: "/deals", cta: "Shop deals" }, ...baseAnnouncements.slice(1)]
    : baseAnnouncements;

  useEffect(() => {
    try {
      if (sessionStorage.getItem("hatwear:bar") === "closed") setHidden(true);
    } catch {}
  }, []);

  useEffect(() => {
    if (paused || reduce || announcements.length < 2) return;
    const t = setInterval(() => {
      setDir(1);
      setI((n) => (n + 1) % announcements.length);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [paused, reduce, announcements.length]);

  if (hidden || announcements.length === 0) return null;
  const a = announcements[i % announcements.length];
  const external = a.href?.startsWith("http");
  const step = (d: number) => {
    setDir(d);
    setPaused(true); // manual navigation stops the rotation
    setI((n) => (n + d + announcements.length) % announcements.length);
  };
  const iconBtn = "grid size-9 shrink-0 place-items-center rounded-full text-steel transition-colors hover:bg-white/10 hover:text-white";

  return (
    <div className="bg-ink text-bone" role="region" aria-label="Store announcements" aria-roledescription="carousel">
      <div className="shell flex min-h-10 items-center gap-1 text-[0.84rem] sm:gap-2">
        {announcements.length > 1 && (
          <button type="button" onClick={() => step(-1)} className={`-ml-2 ${iconBtn}`} aria-label="Previous announcement">
            <ChevronIcon size={16} className="rotate-180" />
          </button>
        )}
        <div className="relative flex-1 overflow-hidden text-center" aria-live={paused ? "polite" : "off"}>
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.p
              key={a.id}
              custom={dir}
              initial={{ y: dir > 0 ? "100%" : "-100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: dir > 0 ? "-100%" : "100%", opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
              className="line-clamp-2 py-2 leading-snug sm:truncate"
            >
              <span>{a.text}</span>
              {a.href && a.cta && (
                <>
                  {" "}
                  {external ? (
                    <a href={a.href} target="_blank" rel="noopener noreferrer" className="link ml-1 font-semibold text-white">
                      {a.cta}
                    </a>
                  ) : (
                    <Link href={a.href} className="link ml-1 font-semibold text-white">
                      {a.cta}
                    </Link>
                  )}
                </>
              )}
            </motion.p>
          </AnimatePresence>
        </div>
        {announcements.length > 1 && (
          <>
            <button type="button" onClick={() => setPaused((p) => !p)} className={iconBtn} aria-label={paused ? "Resume announcements" : "Pause announcements"}>
              {paused ? <PlayIcon size={13} /> : <PauseIcon size={13} />}
            </button>
            <button type="button" onClick={() => step(1)} className={iconBtn} aria-label="Next announcement">
              <ChevronIcon size={16} />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => {
            setHidden(true);
            try {
              sessionStorage.setItem("hatwear:bar", "closed");
            } catch {}
          }}
          className={`-mr-2 ${iconBtn}`}
          aria-label="Dismiss announcements"
        >
          <CloseIcon size={16} />
        </button>
      </div>
    </div>
  );
}
