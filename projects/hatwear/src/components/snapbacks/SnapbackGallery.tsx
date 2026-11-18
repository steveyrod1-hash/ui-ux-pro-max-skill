"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { CameraIcon, ChevronIcon } from "../Icons";

export type GalleryView = { id: string; label: string; photo: { src: string; alt: string } | null };

/** "Photo coming soon" box for a view that has no genuine photo yet. */
export function PhotoPlaceholder({ label, compact = false, small = false }: { label: string; compact?: boolean; small?: boolean }) {
  return (
    <div className="grid size-full place-items-center bg-[repeating-linear-gradient(135deg,#eef2f8_0_10px,#e8edf5_10px_20px)] text-center text-stone">
      <div className={compact ? "" : "px-6"}>
        <CameraIcon size={compact ? 22 : small ? 30 : 44} className="mx-auto" strokeWidth={1.4} />
        {!compact && (
          <>
            <p className={`font-display font-extrabold uppercase tracking-wide text-graphite ${small ? "mt-2 text-[0.8rem]" : "mt-3 text-lg"}`}>{label} photo</p>
            <p className={small ? "text-[0.75rem]" : "mt-1 text-sm"}>Coming soon</p>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Four separate product photos (Front, Back, Inside / Underside, Side):
 * a large main image with arrows, and four labelled thumbnail boxes below.
 */
export function SnapbackGallery({ name, views }: { name: string; views: GalleryView[] }) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const go = (n: number) => {
    setDir(n > i || (i === views.length - 1 && n === views.length) ? 1 : -1);
    setI((n + views.length) % views.length);
  };
  const v = views[i];

  return (
    <div className="lg:sticky lg:top-24">
      <div
        className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] bg-white ring-1 ring-ink/10"
        role="region"
        aria-roledescription="carousel"
        aria-label={`${name} photos`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(i + 1);
          if (e.key === "ArrowLeft") go(i - 1);
        }}
      >
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={v.id}
            custom={dir}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 40 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -40 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(i + 1);
              else if (info.offset.x > 60) go(i - 1);
            }}
            className="absolute inset-0 touch-pan-y"
            data-view={v.id}
          >
            {v.photo ? (
              <Image src={v.photo.src} alt={v.photo.alt} fill priority={i === 0} sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain" draggable={false} />
            ) : (
              <PhotoPlaceholder label={v.label} />
            )}
          </motion.div>
        </AnimatePresence>
        <button type="button" onClick={() => go(i - 1)} className="absolute left-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-md ring-1 ring-ink/10 transition-colors hover:bg-white" aria-label="Previous view">
          <ChevronIcon className="rotate-180" />
        </button>
        <button type="button" onClick={() => go(i + 1)} className="absolute right-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-md ring-1 ring-ink/10 transition-colors hover:bg-white" aria-label="Next view">
          <ChevronIcon />
        </button>
        <p className="absolute bottom-3 left-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink shadow-sm ring-1 ring-ink/10" aria-live="polite" data-testid="view-label">
          {i + 1}/{views.length} · {v.label}
          {!v.photo && <span className="font-normal text-stone"> · photo coming soon</span>}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3" role="tablist" aria-label="Choose a view">
        {views.map((x, n) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={n === i}
            aria-label={`${x.label}${x.photo ? "" : ", photo coming soon"}`}
            onClick={() => go(n)}
            className="group flex min-w-0 flex-col text-left"
            data-view={x.id}
          >
            <span
              className={`relative block aspect-square w-full overflow-hidden rounded-lg bg-white ring-1 transition-shadow ${
                n === i ? "ring-2 ring-ink" : "ring-ink/12 group-hover:ring-ink/40"
              }`}
            >
              {x.photo ? <Image src={x.photo.src} alt="" fill sizes="14vw" className="object-contain" /> : <PhotoPlaceholder label={x.label} compact />}
            </span>
            <span className={`mt-1.5 block text-[0.72rem] font-semibold leading-tight sm:text-[0.8rem] ${n === i ? "text-ink" : "text-stone"}`}>{x.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
