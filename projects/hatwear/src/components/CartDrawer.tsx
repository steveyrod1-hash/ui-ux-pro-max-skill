"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { money, plural } from "@/lib/format";
import { ProductMedia } from "./ProductMedia";
import { BagIcon, CloseIcon, MinusIcon, PlusIcon } from "./Icons";
import { DEMO_CATALOG, DEMO_CHECKOUT } from "@/content/site";

export function QtyStepper({
  value,
  max,
  onChange,
  label,
  size = "sm",
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
  size?: "sm" | "md";
}) {
  const h = size === "md" ? "h-12" : "h-10";
  return (
    <div className={`inline-flex ${h} items-stretch rounded-sm border-[1.5px] border-ink/30`} role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className="grid w-10 place-items-center hover:bg-felt disabled:opacity-30"
        aria-label="Decrease quantity"
        disabled={value <= (size === "md" ? 1 : 0)}
      >
        <MinusIcon size={16} />
      </button>
      <span className="grid min-w-9 place-items-center font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="grid w-10 place-items-center hover:bg-felt disabled:opacity-30"
        aria-label="Increase quantity"
        disabled={value >= max}
      >
        <PlusIcon size={16} />
      </button>
    </div>
  );
}

export function CartDrawer() {
  const { cartOpen, closeCart, lines, subtotal, count, setQty, remove, lastAdded } = useStore();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!cartOpen) return;
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [cartOpen, closeCart]);

  return (
    <AnimatePresence>
      {cartOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="cart-title">
          <motion.div
            className="absolute inset-0 bg-ink/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
            className="absolute inset-y-0 right-0 flex w-[min(28rem,100%)] flex-col bg-bone shadow-2xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between px-5">
              <h2 id="cart-title" className="text-3xl uppercase">
                Your bag <span className="text-stone">({count})</span>
              </h2>
              <button ref={closeRef} type="button" onClick={closeCart} className="-mr-2 grid size-11 place-items-center rounded-full hover:bg-felt" aria-label="Close cart">
                <CloseIcon />
              </button>
            </div>
            <div className="stitch mx-5 text-ink/50" aria-hidden="true" />

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <BagIcon size={44} className="text-ink/30" />
                <p className="mt-4 font-display text-3xl font-extrabold uppercase">Nothing in the bag yet</p>
                <p className="mt-2 text-stone">Start with the wall: fitteds, snapbacks, beanies and team gear.</p>
                <Link href="/shop" onClick={closeCart} className="btn btn-dark mt-6">
                  Shop headwear
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 overflow-y-auto px-5 py-2">
                  <AnimatePresence initial={false}>
                    {lines.map((l) => (
                      <motion.li
                        key={l.key}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                        className="overflow-hidden"
                      >
                        <div className={`flex gap-4 border-b border-ink/10 py-4 ${l.key === lastAdded ? "" : ""}`}>
                          <Link href={`/product/${l.product.slug}?color=${l.colorId}`} onClick={closeCart} className="size-24 shrink-0 bg-felt">
                            <ProductMedia product={l.product} colorId={l.colorId} className="size-full" shadow={false} />
                          </Link>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex justify-between gap-3">
                              <Link href={`/product/${l.product.slug}?color=${l.colorId}`} onClick={closeCart} className="font-semibold leading-snug hover:underline">
                                {l.product.name}
                              </Link>
                              <span className="font-semibold tabular-nums">{money(l.lineTotal)}</span>
                            </div>
                            <p className="mt-0.5 text-sm text-stone">
                              {l.colorName} · {l.size}
                            </p>
                            {l.maxQty <= 2 && l.maxQty > 0 && <p className="mt-0.5 text-xs font-semibold text-warn">Only {l.maxQty} left</p>}
                            <div className="mt-auto flex items-center justify-between pt-2">
                              <QtyStepper value={l.qty} max={l.maxQty} onChange={(n) => setQty(l.key, n)} label={`Quantity for ${l.product.name}`} />
                              <button type="button" onClick={() => remove(l.key)} className="text-sm text-stone underline underline-offset-2 hover:text-ink">
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <div className="shrink-0 border-t-2 border-ink bg-chalk px-5 pb-5 pt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold">Subtotal · {plural(count, "item")}</span>
                    <motion.span key={subtotal} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="font-display text-3xl font-extrabold tabular-nums">
                      {money(subtotal)}
                    </motion.span>
                  </div>
                  <p className="mt-1 text-sm text-stone">Tax calculated at checkout.{DEMO_CATALOG && " Prices are sample prices for this preview."}</p>
                  <Link href="/checkout" onClick={closeCart} className="btn btn-primary mt-4 w-full">
                    {DEMO_CHECKOUT ? "Review order" : "Checkout"}
                  </Link>
                  <button type="button" onClick={closeCart} className="mt-2 w-full py-2 text-sm font-semibold underline underline-offset-2">
                    Keep shopping
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
