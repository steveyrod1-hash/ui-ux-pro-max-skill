"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Product } from "@/data/types";
import { TYPE_LABELS, unitsFor } from "@/lib/catalog";
import { money } from "@/lib/format";
import { sizeRangeLabel } from "@/lib/sizes";
import { ProductMedia } from "./ProductMedia";
import { PurchasePanel, WishButton } from "./PurchasePanel";
import { Modal } from "./Modal";
import { ArrowIcon } from "./Icons";

export function QuickView({ product, open, onClose, initialColor }: { product: Product; open: boolean; onClose: () => void; initialColor: string }) {
  const [colorId, setColorId] = useState(initialColor);
  return (
    <Modal open={open} onClose={onClose} title={`Quick view: ${product.name}`} wide>
      <div className="grid md:grid-cols-2">
        <div className="relative aspect-square bg-felt md:aspect-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={colorId} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} className="size-full">
              <ProductMedia product={product} colorId={colorId} className="size-full" />
            </motion.div>
          </AnimatePresence>
          <span className="absolute bottom-3 left-3 text-xs font-medium text-graphite">Illustration</span>
        </div>
        <div className="p-5 sm:p-8">
          <p className="text-sm text-stone">
            {product.brand} · {TYPE_LABELS[product.type]}
          </p>
          <h2 className="mt-1 pr-10 text-4xl uppercase">{product.name}</h2>
          <p className="mt-2 font-display text-3xl font-extrabold">{money(product.price)}</p>
          <div className="stitch my-5 text-ink/40" aria-hidden="true" />
          <PurchasePanel product={product} colorId={colorId} onColorChange={setColorId} compact />
          <Link href={`/product/${product.slug}?color=${colorId}`} onClick={onClose} className="link mt-6 inline-flex items-center gap-2 font-semibold">
            Full details <ArrowIcon size={18} />
          </Link>
        </div>
      </div>
    </Modal>
  );
}

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const [colorId, setColorId] = useState(product.colorways[0].id);
  const [hover, setHover] = useState(false);
  const [quick, setQuick] = useState(false);
  const total = unitsFor(product);
  const colorUnits = unitsFor(product, colorId);
  const href = `/product/${product.slug}${colorId !== product.colorways[0].id ? `?color=${colorId}` : ""}`;
  const altView = product.type === "hoodie" || product.type === "windbreaker" || product.type === "beanie" ? "back" : "side";

  return (
    <article className="group relative flex flex-col" onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)} onPointerLeave={() => setHover(false)}>
      <div className="relative aspect-[4/5] overflow-hidden bg-felt">
        <Link href={href} className="absolute inset-0" aria-label={product.name} tabIndex={-1}>
          <motion.div animate={{ opacity: hover ? 0 : 1, scale: hover ? 1.03 : 1 }} transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }} className="absolute inset-0 p-[6%]">
            <ProductMedia product={product} colorId={colorId} className="size-full" priority={priority} />
          </motion.div>
          <motion.div
            initial={false}
            animate={{ opacity: hover ? 1 : 0, scale: hover ? 1 : 0.97 }}
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            className="absolute inset-0 p-[6%]"
            aria-hidden="true"
          >
            <ProductMedia product={product} colorId={colorId} view={altView} className="size-full" />
          </motion.div>
        </Link>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {total === 0 ? (
            <span className="label label-bone">Sold out</span>
          ) : product.isNew ? (
            <span className="label">New</span>
          ) : null}
          {total > 0 && colorUnits > 0 && colorUnits <= 2 && <span className="label label-bone">Low stock</span>}
        </div>
        <WishButton id={product.id} name={product.name} className="absolute right-2 top-2 z-10 size-11 bg-bone/0 hover:bg-bone/70" />
        <button
          type="button"
          onClick={() => setQuick(true)}
          className="absolute inset-x-3 bottom-3 hidden h-11 translate-y-2 items-center justify-center rounded-sm bg-ink font-display text-[0.95rem] font-bold uppercase tracking-[0.08em] text-bone opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 md:flex"
        >
          Quick view
        </button>
        <span className="pointer-events-none absolute bottom-2 left-3 text-xs font-medium text-graphite md:group-hover:opacity-0">Illustration</span>
      </div>

      <div className="flex flex-1 flex-col pt-3">
        <p className="text-[0.8rem] text-stone">
          {product.team ?? product.brand} · {TYPE_LABELS[product.type]}
        </p>
        <h3 className="mt-0.5 font-sans text-[1rem] font-semibold leading-snug tracking-normal">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] md:after:hidden hover:underline">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <p className="font-semibold tabular-nums">{money(product.price)}</p>
          <p className="text-[0.8rem] text-stone">{sizeRangeLabel(product.sizes)}</p>
        </div>
        <div className="relative z-10 mt-2.5 flex items-center gap-1.5">
          {product.colorways.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setColorId(c.id)}
              onPointerEnter={(e) => e.pointerType === "mouse" && setColorId(c.id)}
              aria-label={`Show ${c.name}`}
              aria-pressed={c.id === colorId}
              className="grid size-7 place-items-center"
            >
              <span
                className={`block size-[1.1rem] rounded-full ring-offset-2 ring-offset-bone transition-shadow ${c.id === colorId ? "ring-2 ring-ink" : "ring-1 ring-ink/25"}`}
                style={{ background: `linear-gradient(135deg, ${c.art.crown} 0 58%, ${c.art.mark} 58% 100%)` }}
              />
            </button>
          ))}
          <button type="button" onClick={() => setQuick(true)} className="relative z-10 ml-auto text-[0.8rem] font-semibold underline underline-offset-2 md:hidden">
            Quick view
          </button>
        </div>
      </div>
      {quick && <QuickView product={product} open={quick} onClose={() => setQuick(false)} initialColor={colorId} />}
    </article>
  );
}
