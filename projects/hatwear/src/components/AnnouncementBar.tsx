"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { announcements } from "@/content/site";
import { CloseIcon, PauseIcon, PlayIcon } from "./Icons";

const ROTATE_MS = 6000;

export function AnnouncementBar() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    try {
      if (sessionStorage.getItem("hatwear:bar") === "closed") setHidden(true);
    } catch {}
  }, []);

  useEffect(() => {
    if (paused || reduce || announcements.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % announcements.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [paused, reduce]);

  if (hidden || announcements.length === 0) return null;
  const a = announcements[i];
  const external = a.href?.startsWith("http");

  return (
    <div className="twill bg-ink text-bone" role="region" aria-label="Store announcements">
      <div className="shell flex min-h-10 items-center gap-3 text-[0.82rem]">
        {announcements.length > 1 && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="-ml-2 grid size-9 shrink-0 place-items-center rounded-full text-bone/70 hover:text-bone"
            aria-label={paused ? "Resume announcements" : "Pause announcements"}
          >
            {paused ? <PlayIcon size={14} /> : <PauseIcon size={14} />}
          </button>
        )}
        <div className="relative flex-1 overflow-hidden text-center" aria-live={paused ? "polite" : "off"}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={a.id}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
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
          <div className="hidden shrink-0 gap-1.5 sm:flex" aria-hidden="true">
            {announcements.map((x, n) => (
              <span key={x.id} className={`h-1 w-4 rounded-full transition-colors ${n === i ? "bg-red" : "bg-bone/25"}`} />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setHidden(true);
            try {
              sessionStorage.setItem("hatwear:bar", "closed");
            } catch {}
          }}
          className="-mr-2 grid size-9 shrink-0 place-items-center rounded-full text-bone/70 hover:text-bone"
          aria-label="Dismiss announcements"
        >
          <CloseIcon size={16} />
        </button>
      </div>
    </div>
  );
}
