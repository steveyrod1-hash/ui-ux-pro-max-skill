"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useId, useState } from "react";
import type { Product } from "@/data/types";
import { availability, AVAILABILITY_LABEL, unitsFor } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { chartFor } from "@/lib/sizes";
import { money } from "@/lib/format";
import { QtyStepper } from "./CartDrawer";
import { CheckIcon, HeartIcon, RulerIcon } from "./Icons";
import { SizeGuideDialog } from "./SizeGuide";

export function ColorSwatches({
  product,
  value,
  onChange,
  name,
}: {
  product: Product;
  value: string;
  onChange: (id: string) => void;
  name: string;
}) {
  const current = product.colorways.find((c) => c.id === value);
  return (
    <fieldset>
      <legend className="text-sm">
        <span className="font-semibold">Colour</span> <span className="text-stone">· {current?.name}</span>
      </legend>
      <div className="mt-2.5 flex flex-wrap gap-2.5">
        {product.colorways.map((c) => {
          const soldOut = unitsFor(product, c.id) === 0;
          return (
            <label key={c.id} className="relative cursor-pointer" title={c.name}>
              <input
                type="radio"
                name={name}
                value={c.id}
                checked={c.id === value}
                onChange={() => onChange(c.id)}
                className="peer sr-only"
              />
              <span
                className="block size-10 rounded-full ring-1 ring-ink/20 ring-offset-2 ring-offset-bone transition-shadow peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-sign"
                style={{ background: `linear-gradient(135deg, ${c.art.crown} 0 58%, ${c.art.mark} 58% 100%)` }}
              />
              {soldOut && <span className="absolute left-1/2 top-1/2 h-[2px] w-11 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-ink/60" />}
              <span className="sr-only">
                {c.name}
                {soldOut ? ", sold out" : ""}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function SizeSelector({
  product,
  colorId,
  value,
  onChange,
  name,
}: {
  product: Product;
  colorId: string;
  value: string;
  onChange: (s: string) => void;
  name: string;
}) {
  // The fitted size guide only applies to true fitted sizes (not stretch-fit S/M, L/XL).
  const fitted = product.type === "fitted" && product.sizes.some((s) => /^\d/.test(s));
  const [guideOpen, setGuideOpen] = useState(false);
  const chart = fitted && value ? chartFor(value) : undefined;
  if (product.sizes.length === 1) {
    return (
      <p className="text-sm">
        <span className="font-semibold">Size</span> <span className="text-stone">· {product.sizes[0]}{product.type !== "beanie" ? " (adjustable)" : ""}</span>
      </p>
    );
  }
  return (
    <fieldset>
      <div className="flex items-baseline justify-between">
        <legend className="text-sm">
          <span className="font-semibold">Size</span>{" "}
          <span className="text-stone">
            · {value ? value : "Choose a size"}
            {chart && ` (${chart.inches}″ / ${chart.cm} cm)`}
          </span>
        </legend>
        {fitted && (
          <button type="button" onClick={() => setGuideOpen(true)} className="-my-3 inline-flex min-h-11 items-center gap-1.5 px-1 text-sm font-semibold underline underline-offset-2">
            <RulerIcon size={16} /> Size guide
          </button>
        )}
      </div>
      <div className={`mt-2.5 grid gap-2 ${fitted ? "grid-cols-5" : "grid-cols-5 sm:grid-cols-6"}`}>
        {product.sizes.map((s) => {
          const units = unitsFor(product, colorId, s);
          const out = units === 0;
          const selected = s === value;
          return (
            <label key={s} className={`relative ${out ? "cursor-not-allowed" : "cursor-pointer"}`}>
              <input
                type="radio"
                name={name}
                value={s}
                checked={selected}
                disabled={out}
                onChange={() => onChange(s)}
                className="peer sr-only"
              />
              <span
                className={`relative grid h-12 place-items-center rounded-sm border-[1.5px] text-[0.95rem] font-semibold tabular-nums transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sign ${
                  out
                    ? "border-ink/15 text-ink/50 line-through"
                    : selected
                      ? "border-ink text-bone"
                      : "border-ink/25 hover:border-ink"
                }`}
              >
                {selected && (
                  <motion.span layoutId={`${name}-size`} className="absolute inset-0 bg-ink" transition={{ type: "spring", stiffness: 520, damping: 38 }} />
                )}
                <span className="relative">{s}</span>
              </span>
              {!out && units <= 2 && <span className="absolute -top-1.5 right-1 size-2 rounded-full bg-warn" aria-hidden="true" />}
              <span className="sr-only">{out ? ", sold out" : units <= 2 ? ", only a few left" : ""}</span>
            </label>
          );
        })}
      </div>
      {fitted && <SizeGuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} product={product} onPick={(s) => onChange(s)} />}
    </fieldset>
  );
}

export function StockStatus({ units }: { units: number }) {
  const a = availability(units);
  const color = a === "in-stock" ? "bg-ok" : a === "low-stock" ? "bg-warn" : "bg-ink/40";
  return (
    <p className="inline-flex items-center gap-2 text-sm font-semibold">
      <span className={`size-2.5 rounded-full ${color}`} aria-hidden="true" />
      {a === "low-stock" ? `Only ${units} left` : AVAILABILITY_LABEL[a]}
    </p>
  );
}

export function WishButton({ id, name, className = "" }: { id: string; name: string; className?: string }) {
  const { isWished, toggleWish, hydrated } = useStore();
  const on = hydrated && isWished(id);
  return (
    <button
      type="button"
      onClick={() => toggleWish(id)}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      className={`grid place-items-center rounded-full transition-colors ${on ? "text-sign" : "text-ink hover:text-sign"} ${className}`}
    >
      <motion.span key={String(on)} initial={on ? { scale: 0.6 } : false} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 14 }}>
        <HeartIcon filled={on} />
      </motion.span>
    </button>
  );
}

/** Colour, size, quantity and add-to-bag, shared by Quick View and the product page. */
export function PurchasePanel({
  product,
  colorId,
  onColorChange,
  compact = false,
  onAdded,
}: {
  product: Product;
  colorId: string;
  onColorChange: (id: string) => void;
  compact?: boolean;
  onAdded?: () => void;
}) {
  const uid = useId();
  const { add } = useStore();
  const single = product.sizes.length === 1 ? product.sizes[0] : "";
  const [size, setSize] = useState(single);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  // A size that sells out in the new colourway is cleared rather than silently kept.
  useEffect(() => {
    if (size && unitsFor(product, colorId, size) === 0) setSize(single);
    setQty(1);
  }, [colorId]); // eslint-disable-line react-hooks/exhaustive-deps

  const units = size ? unitsFor(product, colorId, size) : unitsFor(product, colorId);
  const soldOut = unitsFor(product, colorId) === 0;

  const onAdd = () => {
    if (!size) {
      setError("Choose a size first.");
      return;
    }
    setError("");
    add({ productId: product.id, colorId, size, qty });
    setAdded(true);
    onAdded?.();
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="space-y-6">
      <ColorSwatches product={product} value={colorId} onChange={onColorChange} name={`${uid}-color`} />
      <SizeSelector
        product={product}
        colorId={colorId}
        value={size}
        onChange={(s) => {
          setSize(s);
          setError("");
          setQty(1);
        }}
        name={`${uid}-size`}
      />
      <div className="flex items-center justify-between gap-4">
        <StockStatus units={units} />
        {!soldOut && size && <QtyStepper value={qty} max={Math.max(1, units)} onChange={(n) => setQty(Math.max(1, n))} label="Quantity" size="md" />}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onAdd} disabled={soldOut || (!!size && units === 0)} className="btn btn-primary relative flex-1 overflow-hidden" aria-describedby={error ? `${uid}-err` : undefined}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={added ? "added" : "add"}
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -18, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="inline-flex items-center gap-2"
            >
              {soldOut ? "Sold out" : added ? (
                <>
                  <CheckIcon size={20} /> Added
                </>
              ) : (
                `Add to bag · ${money(product.price * qty)}`
              )}
            </motion.span>
          </AnimatePresence>
        </button>
        <WishButton id={product.id} name={product.name} className="size-12 shrink-0 border-[1.5px] border-ink/25 !rounded-sm" />
      </div>
      {error && (
        <p id={`${uid}-err`} role="alert" className="-mt-3 text-sm font-semibold text-sign-deep">
          {error}
        </p>
      )}
      {soldOut && (
        <p className="-mt-2 text-sm text-stone">
          Sold out online.{" "}
          <Link href="/store" className="link font-semibold text-ink">
            Call or visit the store
          </Link>{" "}
          to check other sizes and colours.
        </p>
      )}
      {!compact && product.embroideryReady && (
        <Link href={`/custom?base=${product.type}&color=${colorId}`} className="btn btn-ghost btn-ghost-dark w-full">
          Customize this blank
        </Link>
      )}
    </div>
  );
}
