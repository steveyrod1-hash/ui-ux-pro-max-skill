"use client";

import Link from "next/link";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/data/types";
import { TYPE_LABELS } from "@/data/catalog";
import { money } from "@/lib/format";
import { ProductMedia, hasPhotos } from "../ProductMedia";
import type { ArtView } from "../ProductArt";
import { PurchasePanel } from "../PurchasePanel";
import { PriceTag, useUnitPrice } from "../PriceTag";
import { DealCountdown } from "../deals/Countdown";
import { ChevronIcon } from "../Icons";
import { DEMO_CHECKOUT } from "@/content/site";

const VIEWS: { id: ArtView; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "side", label: "Side" },
  { id: "back", label: "Back" },
  { id: "detail", label: "Stitch detail" },
];

function Gallery({ product, colorId }: { product: Product; colorId: string }) {
  const views = product.type === "beanie" || product.type === "hoodie" || product.type === "windbreaker" ? VIEWS.filter((v) => v.id !== "side") : VIEWS;
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const go = (n: number) => {
    setDir(n > i ? 1 : -1);
    setI((n + views.length) % views.length);
  };
  const v = views[i];

  return (
    <div className="lg:sticky lg:top-24">
      <div
        className="relative aspect-square overflow-hidden bg-felt"
        role="region"
        aria-roledescription="carousel"
        aria-label={`${product.name} images`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(i + 1);
          if (e.key === "ArrowLeft") go(i - 1);
        }}
      >
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={`${v.id}-${colorId}`}
            custom={dir}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 40 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -40 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.38, ease: [0.25, 1, 0.5, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(i + 1);
              else if (info.offset.x > 60) go(i - 1);
            }}
            className={`absolute inset-0 touch-pan-y ${v.id === "detail" ? "" : "p-[5%]"}`}
          >
            <ProductMedia product={product} colorId={colorId} view={v.id} className="size-full" priority={i === 0} sizes="(min-width: 1024px) 50vw, 100vw" />
          </motion.div>
        </AnimatePresence>
        <button type="button" onClick={() => go(i - 1)} className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-bone/80 shadow-sm hover:bg-bone" aria-label="Previous image">
          <ChevronIcon className="rotate-180" />
        </button>
        <button type="button" onClick={() => go(i + 1)} className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-bone/80 shadow-sm hover:bg-bone" aria-label="Next image">
          <ChevronIcon />
        </button>
        <p className="absolute bottom-3 left-4 text-xs text-graphite" aria-live="polite">
          {v.label} · {hasPhotos(product) ? "Photo" : "Illustration, not a product photo"}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2" role="tablist" aria-label="Choose a view">
        {views.map((x, n) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={n === i}
            aria-label={x.label}
            onClick={() => go(n)}
            className={`relative aspect-square overflow-hidden bg-felt transition-opacity ${n === i ? "" : "opacity-70 hover:opacity-100"}`}
          >
            <ProductMedia product={product} colorId={colorId} view={x.id} className={`size-full ${x.id === "detail" ? "" : "p-[8%]"}`} shadow={false} sizes="12vw" />
            {n === i && <motion.span layoutId="thumb-ring" className="absolute inset-0 ring-2 ring-inset ring-ink" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function Disclosure({ title, children, open: initial = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className="border-b border-ink/15">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between py-4 font-display text-xl font-extrabold uppercase tracking-wide">
        {title}
        <ChevronIcon size={18} className={`transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="pb-5 text-graphite">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ProductDetail({ product }: { product: Product }) {
  const [colorId, setColorId] = useState(product.colorways[0].id);
  const unitPrice = useUnitPrice(product);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelVisible = useInView(panelRef, { margin: "0px 0px -20% 0px" });
  const [scrolled, setScrolled] = useState(false);

  // Deep links: /product/slug?color=<id>
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("color");
    if (c && product.colorways.some((x) => x.id === c)) setColorId(c);
    const onScroll = () => setScrolled(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [product]);

  const changeColor = (id: string) => {
    setColorId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("color", id);
    window.history.replaceState(null, "", url);
  };

  const showBar = scrolled && !panelVisible;

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <Gallery product={product} colorId={colorId} />
        <div>
          <p className="text-sm text-stone">
            {product.brand} · {TYPE_LABELS[product.type]}
            {product.league && (
              <>
                {" · "}
                <Link href={`/shop?team=${encodeURIComponent(product.team!)}`} className="hover:text-ink hover:underline">
                  {product.team}
                </Link>
              </>
            )}
          </p>
          <h1 className="mt-2 text-[clamp(2.6rem,1.8rem+3vw,4.4rem)] uppercase">{product.name}</h1>
          <PriceTag product={product} size="lg" className="mt-3" />
          <DealCountdown productId={product.id} />
          <p className="mt-4 max-w-prose text-[1.05rem] text-graphite">{product.description}</p>
          <div className="stitch my-7 text-ink/40" aria-hidden="true" />
          <div ref={panelRef} id="buy">
            <PurchasePanel product={product} colorId={colorId} onColorChange={changeColor} />
          </div>
          {product.type !== "hoodie" && product.type !== "windbreaker" && (
          <p className="mt-6 text-sm text-stone">
            Want it embroidered?{" "}
            <Link href={`/custom?base=${product.type}&color=${colorId}`} className="link font-semibold text-ink">
              Start a custom request
            </Link>{" "}
            and mention this hat.
          </p>
          )}
          <div className="mt-8 border-t border-ink/15">
            <Disclosure title="Details" open>
              <ul className="list-disc space-y-1 pl-5">
                {product.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </Disclosure>
            <Disclosure title="Care">
              <ul className="list-disc space-y-1 pl-5">
                {product.care.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </Disclosure>
            <Disclosure title="Pickup and returns">
              <p>
                {DEMO_CHECKOUT
                  ? "Online ordering is not switched on yet. Call the store to check stock, or come in and try it on."
                  : "Order online and pick up free at the store inside Sherwood Place. HatWear lets you know when it's ready."}{" "}
                Return and exchange terms will be published here once the store confirms them.
              </p>
            </Disclosure>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showBar && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
            className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-bone/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden"
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{product.name}</p>
                <p className="font-display text-xl font-black tabular-nums">{money(unitPrice)}</p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  document.getElementById("buy")?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              >
                {product.sizes.length > 1 ? "Choose size" : "Add to bag"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
