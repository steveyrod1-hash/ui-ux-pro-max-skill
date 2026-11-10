"use client";

import { useState } from "react";
import type { Product } from "@/data/types";
import { unitsFor } from "@/lib/catalog";
import { FITTED_SIZE_CHART, sizeForCm } from "@/lib/sizes";
import { Modal } from "./Modal";

export function HeadDiagram() {
  return (
    <svg viewBox="0 0 220 160" className="w-full max-w-[16rem]" aria-hidden="true">
      <ellipse cx="110" cy="96" rx="58" ry="60" fill="#e2dcd2" />
      <path d="M52 92 C52 50 78 26 110 26 C142 26 168 50 168 92" fill="#2b2a28" />
      <ellipse cx="110" cy="88" rx="66" ry="14" fill="none" stroke="#d2261c" strokeWidth="3" strokeDasharray="7 5" />
      <path d="M176 88 L206 88" stroke="#d2261c" strokeWidth="2" />
      <text x="206" y="80" textAnchor="end" fontSize="11" fontWeight="700" fill="#1a1918" fontFamily="var(--font-sans)">
        tape here
      </text>
      <circle cx="88" cy="104" r="3" fill="#1a1918" />
      <circle cx="132" cy="104" r="3" fill="#1a1918" />
    </svg>
  );
}

export function SizeGuideContent({ product, onPick }: { product?: Product; onPick?: (size: string) => void }) {
  const [unit, setUnit] = useState<"in" | "cm">("in");
  const [measure, setMeasure] = useState("");
  const value = parseFloat(measure);
  const cm = unit === "in" ? value * 2.54 : value;
  const rec = measure ? sizeForCm(cm) : undefined;
  const outOfRange = rec && (cm < 52 || cm > 66);
  const available = (s: string) => !product || (product.sizes.includes(s) && unitsFor(product, undefined, s) > 0);

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_1.15fr]">
      <div>
        <HeadDiagram />
        <ol className="mt-4 space-y-3 text-[0.95rem]">
          <li>
            <span className="font-semibold">1. Wrap a soft tape</span> around your head about 1 cm above your ears and eyebrows, where the hat sits.
          </li>
          <li>
            <span className="font-semibold">2. Keep it level and snug,</span> not tight. No tape? Use a string and measure it flat.
          </li>
          <li>
            <span className="font-semibold">3. Between two sizes?</span> Go up. A fitted shapes to you a little, but it never stretches much.
          </li>
        </ol>
        <div className="mt-6 rounded-sm bg-felt p-4">
          <label htmlFor="head-measure" className="font-semibold">
            Find my size
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="head-measure"
              inputMode="decimal"
              value={measure}
              onChange={(e) => setMeasure(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder={unit === "in" ? "e.g. 22.75" : "e.g. 58"}
              className="field min-w-0 flex-1"
              data-autofocus
            />
            <div className="flex rounded-sm border-[1.5px] border-ink/30" role="group" aria-label="Unit">
              {(["in", "cm"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  aria-pressed={unit === u}
                  className={`w-12 font-semibold ${unit === u ? "bg-ink text-bone" : "hover:bg-bone"}`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-3 min-h-6 text-[0.95rem]" aria-live="polite">
            {rec && !outOfRange && (
              <>
                Your size is <span className="font-display text-2xl font-extrabold">{rec.size}</span>
                {product && !available(rec.size) && <span className="text-stone"> (not in stock for this hat)</span>}
              </>
            )}
            {outOfRange && <span className="text-stone">That measurement is outside the usual fitted range. Double-check it, or come in and try a few on.</span>}
          </p>
          {rec && !outOfRange && onPick && available(rec.size) && (
            <button type="button" onClick={() => onPick(rec.size)} className="btn btn-dark mt-2 w-full">
              Choose {rec.size}
            </button>
          )}
        </div>
      </div>
      <div>
        <table className="w-full text-left tabular-nums">
          <caption className="sr-only">Fitted hat sizes by head circumference</caption>
          <thead>
            <tr className="border-b-2 border-ink font-display text-lg uppercase tracking-wide">
              <th className="py-2">Hat size</th>
              <th className="py-2">Inches</th>
              <th className="py-2">cm</th>
              {product && <th className="py-2 text-right">This hat</th>}
            </tr>
          </thead>
          <tbody>
            {FITTED_SIZE_CHART.map((r) => {
              const hit = rec && !outOfRange && rec.size === r.size;
              return (
                <tr key={r.size} className={`border-b border-ink/10 ${hit ? "bg-red/10 font-semibold" : ""}`}>
                  <td className="py-2.5 font-semibold">{r.size}</td>
                  <td className="py-2.5">{r.inches}″</td>
                  <td className="py-2.5">{r.cm}</td>
                  {product && <td className="py-2.5 text-right text-sm">{available(r.size) ? "In stock" : <span className="text-stone">—</span>}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-4 text-sm text-stone">
          Snapbacks, truckers, adjustable caps and beanies are one size and adjust to fit. Still unsure? Try on the real thing at the store.
        </p>
      </div>
    </div>
  );
}

export function SizeGuideDialog({
  open,
  onClose,
  product,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  product?: Product;
  onPick?: (s: string) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Fitted size guide" wide>
      <div className="p-5 sm:p-8">
        <h2 className="pr-12 text-4xl uppercase sm:text-5xl">Fitted size guide</h2>
        <div className="stitch my-5 text-ink/50" aria-hidden="true" />
        <SizeGuideContent
          product={product}
          onPick={
            onPick &&
            ((s) => {
              onPick(s);
              onClose();
            })
          }
        />
      </div>
    </Modal>
  );
}
