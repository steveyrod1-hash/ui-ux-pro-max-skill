"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  filtersToParams,
  parseFilters,
  queryProducts,
  SORT_LABELS,
  type FacetOption,
  type Filters,
  type SortKey,
} from "@/lib/catalog";
import { TYPE_LABELS } from "@/data/catalog";
import { STYLE_BY_ID } from "@/data/styles";
import type { ProductType } from "@/data/types";
import { ProductCard } from "../ProductCard";
import { CloseIcon, FilterIcon, ChevronIcon, SearchIcon } from "../Icons";
import { plural } from "@/lib/format";
import { DEMO_CATALOG } from "@/content/site";

type ListKey = "type" | "style" | "league" | "team" | "brand" | "size" | "color" | "price";

const GROUPS: { key: ListKey; label: string; open?: boolean }[] = [
  { key: "type", label: "Category", open: true },
  { key: "style", label: "Style", open: true },
  { key: "league", label: "League", open: true },
  { key: "team", label: "Team" },
  { key: "size", label: "Size" },
  { key: "color", label: "Colour" },
  { key: "price", label: "Price" },
  { key: "brand", label: "Brand" },
];

const COLOR_DOT: Record<string, string> = {
  Black: "#1c1b1a",
  Charcoal: "#3a3936",
  White: "#efebe4",
  Navy: "#1b2840",
  Royal: "#24468a",
  Red: "#c4231b",
  Green: "#17633a",
  Purple: "#4b2a72",
  Brown: "#3a2b20",
  Gold: "#e9b631",
  Tan: "#c9b48f",
};

function titleFor(f: Filters) {
  if (f.q) return `“${f.q}”`;
  if (f.style.length === 1) return STYLE_BY_ID[f.style[0]]?.label ?? "Shop";
  if (f.team.length === 1) return f.team[0];
  if (f.league.length === 1 && !f.type.length) return `${f.league[0]} headwear and gear`;
  if (f.type.length === 1) return TYPE_LABELS[f.type[0]] === "Fitted" ? "Fitted hats" : `${TYPE_LABELS[f.type[0]]}s`;
  if (f.type.length === 2 && f.type.includes("hoodie") && f.type.includes("windbreaker")) return "Streetwear";
  return "Shop all";
}

function FacetGroup({
  label,
  k,
  options,
  selected,
  onToggle,
  defaultOpen,
}: {
  label: string;
  k: ListKey;
  options: FacetOption[];
  selected: string[];
  onToggle: (k: ListKey, v: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || selected.length > 0);
  if (!options.length) return null;
  const isSize = k === "size";
  return (
    <div className="border-b border-ink/15 py-1">
      <h2 className="m-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center justify-between py-3 font-display text-xl font-extrabold uppercase tracking-wide"
        >
          <span>
            {label}
            {selected.length > 0 && <span className="ml-2 font-sans text-sm font-semibold normal-case text-sign">{selected.length}</span>}
          </span>
          <ChevronIcon size={18} className={`transition-transform ${open ? "rotate-90" : ""}`} />
        </button>
      </h2>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <ul className={`pb-3 ${isSize ? "grid grid-cols-4 gap-1.5" : "space-y-0.5"} ${k === "team" ? "max-h-72 overflow-y-auto pr-1" : ""}`}>
              {options.map((o) => {
                const on = selected.includes(o.value);
                const disabled = !on && o.count === 0;
                return (
                  <li key={o.value}>
                    <label
                      className={`flex cursor-pointer items-center gap-2.5 rounded-sm ${
                        isSize
                          ? `h-10 justify-center border-[1.5px] text-sm font-semibold tabular-nums ${on ? "border-ink bg-ink text-bone" : "border-ink/20 hover:border-ink"}`
                          : "py-1.5"
                      } ${disabled ? "pointer-events-none opacity-35" : ""}`}
                    >
                      <input type="checkbox" checked={on} disabled={disabled} onChange={() => onToggle(k, o.value)} className={isSize ? "sr-only" : "size-[1.05rem] accent-ink"} />
                      {k === "color" && <span className="size-4 rounded-full ring-1 ring-ink/25" style={{ background: COLOR_DOT[o.value] ?? "#999" }} aria-hidden="true" />}
                      <span className={isSize ? "" : "flex-1"}>{o.label}</span>
                      {!isSize && <span className="text-sm tabular-nums text-stone">{o.count}</span>}
                    </label>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterPanel({
  f,
  facets,
  onToggle,
  onStock,
}: {
  f: Filters;
  facets: ReturnType<typeof queryProducts>["facets"];
  onToggle: (k: ListKey, v: string) => void;
  onStock: (v: boolean) => void;
}) {
  return (
    <div>
      <label className="flex cursor-pointer items-center justify-between border-b border-ink/15 py-4">
        <span className="font-semibold">In stock only</span>
        <span className="relative inline-flex">
          <input type="checkbox" role="switch" checked={f.inStock} onChange={(e) => onStock(e.target.checked)} className="peer sr-only" />
          <span className="h-7 w-12 rounded-full bg-ink/20 transition-colors peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sign" />
          <span className="absolute left-1 top-1 size-5 rounded-full bg-chalk shadow transition-transform peer-checked:translate-x-5" />
        </span>
      </label>
      {GROUPS.map((g) => (
        <FacetGroup key={g.key} label={g.label} k={g.key} options={facets[g.key]} selected={f[g.key]} onToggle={onToggle} defaultOpen={g.open} />
      ))}
    </div>
  );
}

export function ShopView() {
  const sp = useSearchParams();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const spKey = sp.toString();
  // Local filter state answers clicks immediately; the URL mirrors it (shareable,
  // back/forward friendly) and wins whenever it changes from outside.
  const [f, setF] = useState<Filters>(() => parseFilters(new URLSearchParams(spKey)));
  useEffect(() => setF(parseFilters(new URLSearchParams(spKey))), [spKey]);
  const result = useMemo(() => queryProducts(f), [f]);
  const [sheet, setSheet] = useState(false);
  const [q, setQ] = useState(f.q);

  useEffect(() => setQ(f.q), [f.q]);
  useEffect(() => {
    if (!sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [sheet]);

  const push = (next: Partial<Filters>, keepPage = false) => {
    const merged: Filters = { ...f, ...next, page: keepPage ? next.page ?? f.page : next.page ?? 1 };
    setF(merged);
    const params = filtersToParams(merged);
    const qs = params.toString();
    // Filtering is client-side, so update the URL directly (Next syncs useSearchParams)
    // instead of a router round trip: controls respond instantly and history still works.
    startTransition(() => window.history.pushState(null, "", qs ? `${pathname}?${qs}` : pathname));
  };

  const toggle = (k: ListKey, v: string) => {
    const cur = f[k] as string[];
    push({ [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] } as Partial<Filters>);
  };

  const active: { k: ListKey; v: string; label: string }[] = GROUPS.flatMap((g) =>
    (f[g.key] as string[]).map((v) => ({
      k: g.key,
      v,
      label: result.facets[g.key].find((o) => o.value === v)?.label ?? (g.key === "type" ? TYPE_LABELS[v as ProductType] : v),
    })),
  );
  const anyFilter = active.length > 0 || f.inStock || !!f.q;

  const goPage = (page: number) => {
    push({ page }, true);
    document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="shell pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6 pt-10 sm:pt-14">
        <div>
          <nav aria-label="Breadcrumb" className="text-sm text-stone">
            <Link href="/" className="hover:text-ink">
              Home
            </Link>{" "}
            / <span className="text-ink">Shop</span>
          </nav>
          <h1 className="mt-2 text-[clamp(2.8rem,1.6rem+5vw,6rem)] uppercase">{titleFor(f)}</h1>
        </div>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            push({ q: q.trim() });
          }}
          className="flex w-full items-center gap-2 border-b-2 border-ink sm:w-80"
        >
          <SearchIcon size={20} className="shrink-0 text-ink/60" />
          <label htmlFor="shop-q" className="sr-only">
            Search the catalog
          </label>
          <input id="shop-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the catalog" className="min-w-0 flex-1 bg-transparent py-2.5 focus:outline-none" />
          {q && (
            <button type="button" onClick={() => push({ q: "" })} className="text-sm font-semibold underline">
              Clear
            </button>
          )}
        </form>
      </div>
      {DEMO_CATALOG && (
        <p className="mb-6 rounded-sm bg-felt px-4 py-3 text-sm text-graphite">
          Preview catalog: these are sample products, prices and stock levels with illustrated images, so you can try filtering, sizing and the bag. The real catalog plugs in here.
        </p>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[16.5rem_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2">
            <FilterPanel f={f} facets={result.facets} onToggle={toggle} onStock={(v) => push({ inStock: v })} />
            {anyFilter && (
              <button type="button" onClick={() => push({ q: "", type: [], style: [], league: [], team: [], brand: [], size: [], color: [], price: [], inStock: false })} className="mt-4 text-sm font-semibold underline">
                Clear all filters
              </button>
            )}
          </div>
        </aside>

        <section id="results" aria-label="Products" className="min-w-0 scroll-mt-24">
          <div className="sticky top-16 z-20 -mx-4 flex items-center justify-between gap-3 bg-bone/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0 sm:pb-4">
            <p className="shrink-0 text-sm text-graphite" aria-live="polite">
              {pending ? "Updating…" : plural(result.total, "style")}
            </p>
            <div className="flex min-w-0 items-center gap-2">
              <button type="button" onClick={() => setSheet(true)} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[var(--radius-btn)] border-[1.5px] border-ink/30 px-3 font-semibold sm:px-4 lg:hidden" aria-haspopup="dialog">
                <FilterIcon size={18} /> Filters {active.length + (f.inStock ? 1 : 0) > 0 && <span className="grid size-5 place-items-center rounded-full bg-sign text-xs text-white">{active.length + (f.inStock ? 1 : 0)}</span>}
              </button>
              <label htmlFor="sort" className="sr-only">
                Sort by
              </label>
              <select
                id="sort"
                value={f.sort}
                onChange={(e) => push({ sort: e.target.value as SortKey })}
                className="h-11 w-[8.5rem] min-w-0 rounded-[var(--radius-btn)] border-[1.5px] border-ink/30 bg-transparent px-2.5 text-[0.92rem] font-semibold min-[400px]:w-auto sm:px-3 sm:text-base"
              >
                {Object.entries(SORT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(active.length > 0 || f.inStock) && (
            <ul className="mb-5 flex flex-wrap gap-2" aria-label="Active filters">
              {f.inStock && (
                <li>
                  <button type="button" onClick={() => push({ inStock: false })} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink pl-3.5 pr-2.5 text-sm font-semibold text-bone">
                    In stock <CloseIcon size={15} />
                  </button>
                </li>
              )}
              {active.map((a) => (
                <li key={`${a.k}-${a.v}`}>
                  <button type="button" onClick={() => toggle(a.k, a.v)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink pl-3.5 pr-2.5 text-sm font-semibold text-bone" aria-label={`Remove filter ${a.label}`}>
                    {a.label} <CloseIcon size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {result.items.length === 0 ? (
            <div className="grid place-items-center rounded-sm bg-felt px-6 py-20 text-center">
              <p className="font-display text-4xl font-black uppercase">No match on the site</p>
              <p className="mt-2 max-w-md text-graphite">Try removing a filter. The store carries more than this preview shows, so a call is the fastest way to check something specific.</p>
              <button type="button" onClick={() => push({ q: "", type: [], style: [], league: [], team: [], brand: [], size: [], color: [], price: [], inStock: false })} className="btn btn-dark mt-6">
                Clear filters
              </button>
            </div>
          ) : (
            <motion.ul layout className={`grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:gap-5 2xl:grid-cols-4 ${pending ? "opacity-60" : ""} transition-opacity`}>
              {result.items.map((p, i) => (
                <motion.li key={p.id} layout="position" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.03 }}>
                  <ProductCard product={p} priority={i < 4} />
                </motion.li>
              ))}
            </motion.ul>
          )}

          {result.pages > 1 && (
            <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-1.5">
              <button type="button" disabled={result.page <= 1} onClick={() => goPage(result.page - 1)} className="h-11 rounded-sm px-4 font-semibold hover:bg-felt disabled:opacity-30">
                Previous
              </button>
              {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => goPage(n)}
                  aria-current={n === result.page ? "page" : undefined}
                  className={`grid size-11 place-items-center rounded-sm font-semibold tabular-nums ${n === result.page ? "bg-ink text-bone" : "hover:bg-felt"}`}
                >
                  {n}
                </button>
              ))}
              <button type="button" disabled={result.page >= result.pages} onClick={() => goPage(result.page + 1)} className="h-11 rounded-sm px-4 font-semibold hover:bg-felt disabled:opacity-30">
                Next
              </button>
            </nav>
          )}
        </section>
      </div>

      <AnimatePresence>
        {sheet && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
            <motion.div className="absolute inset-0 bg-ink/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 40 }}
              className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-lg bg-bone"
            >
              <div className="flex items-center justify-between px-5 pb-2 pt-4">
                <h2 className="text-3xl uppercase">Filters</h2>
                <button type="button" onClick={() => setSheet(false)} className="-mr-2 grid size-11 place-items-center" aria-label="Close filters">
                  <CloseIcon />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5">
                <FilterPanel f={f} facets={result.facets} onToggle={toggle} onStock={(v) => push({ inStock: v })} />
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-2 border-t border-ink/15 p-4">
                <button type="button" onClick={() => push({ type: [], style: [], league: [], team: [], brand: [], size: [], color: [], price: [], inStock: false })} className="btn btn-ghost btn-ghost-dark">
                  Clear
                </button>
                <button type="button" onClick={() => setSheet(false)} className="btn btn-dark">
                  Show {plural(result.total, "style")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
