"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ProductArt } from "../ProductArt";

const SAMPLES: { text: string; font: "block" | "athletic" | "script"; thread: string; crown: string }[] = [
  { text: "209", font: "block", thread: "#2557b8", crown: "#1c1b1a" },
  { text: "Lupe", font: "script", thread: "#efebe4", crown: "#1b2840" },
  { text: "TEAM", font: "athletic", thread: "#1c1b1a", crown: "#e9e4da" },
  { text: "J.R.", font: "block", thread: "#e9b631", crown: "#1d3557" },
];

/** A close-up crown that re-stitches sample text while it is on screen. */
export function EmbroideryShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px" });
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const t = setInterval(() => setI((n) => (n + 1) % SAMPLES.length), 2600);
    return () => clearInterval(t);
  }, [inView, reduce]);

  const s = SAMPLES[i];
  return (
    <div ref={ref} className="relative aspect-square overflow-hidden bg-charcoal">
      <AnimatePresence initial={false}>
        <motion.div
          key={i}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
        >
          <ProductArt
            type="fitted"
            view="detail"
            colors={{ crown: s.crown, visor: s.crown, under: "#2a2a2a", button: s.crown, mark: s.thread }}
            embroidery={{ placement: "front", text: s.text, font: s.font, thread: s.thread }}
            className="size-full"
          />
        </motion.div>
      </AnimatePresence>
      {/* Hoop ring */}
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-[7%] size-[86%]" aria-hidden="true">
        <circle cx="50" cy="50" r="48" fill="none" stroke="#efebe4" strokeOpacity=".22" strokeWidth=".6" strokeDasharray="1.6 1.4" />
      </svg>
      <p className="absolute bottom-3 left-4 text-xs text-bone/70">Illustrated preview, not a production proof</p>
    </div>
  );
}
