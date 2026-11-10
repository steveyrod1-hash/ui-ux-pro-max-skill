"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Wordmark } from "./Brand";
import { BagIcon, CloseIcon, HeartIcon, MenuIcon, PhoneIcon, PinIcon, SearchIcon, ArrowIcon, InstagramIcon } from "./Icons";
import { ProductArt } from "./ProductArt";
import { useStore } from "@/lib/store";
import { searchProducts, TYPE_LABELS } from "@/lib/catalog";
import { money } from "@/lib/format";
import { mapLinks, site } from "@/content/site";

export const NAV = [
  { label: "Shop All", href: "/shop", match: (p: string, t: string | null) => p === "/shop" && !t },
  { label: "Fitted Hats", href: "/shop?type=fitted", match: (p: string, t: string | null) => p === "/shop" && t === "fitted" },
  { label: "Snapbacks", href: "/shop?type=snapback", match: (p: string, t: string | null) => p === "/shop" && t === "snapback" },
  { label: "Teams", href: "/teams", match: (p: string) => p.startsWith("/teams") },
  {
    label: "Streetwear",
    href: "/shop?type=hoodie,windbreaker",
    match: (p: string, t: string | null) => p === "/shop" && t === "hoodie,windbreaker",
  },
  { label: "Custom Embroidery", href: "/custom", match: (p: string) => p.startsWith("/custom") },
  { label: "Our Store", href: "/store", match: (p: string) => p.startsWith("/store") },
];

function NavLinks({ onNavigate, mobile = false }: { onNavigate?: () => void; mobile?: boolean }) {
  const pathname = usePathname();
  const type = useSearchParams().get("type");
  return <NavList pathname={pathname} type={type} onNavigate={onNavigate} mobile={mobile} />;
}

function NavList({
  pathname,
  type,
  onNavigate,
  mobile,
}: {
  pathname: string;
  type: string | null;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  if (mobile) {
    return (
      <ul className="flex flex-col">
        {NAV.map((n, i) => {
          const active = n.match(pathname, type);
          return (
            <motion.li
              key={n.href}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 + i * 0.04, type: "spring", stiffness: 420, damping: 36 }}
            >
              <Link
                href={n.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className="group flex items-center justify-between border-b border-bone/12 py-3.5 font-display text-[2.1rem] font-extrabold uppercase leading-none tracking-wide"
              >
                <span className={active ? "text-red" : ""}>{n.label}</span>
                <ArrowIcon size={22} className="text-bone/40 transition-transform group-hover:translate-x-1 group-hover:text-bone" />
              </Link>
            </motion.li>
          );
        })}
      </ul>
    );
  }
  return (
    <ul className="flex items-center gap-[clamp(0.6rem,1.4vw,1.6rem)]">
      {NAV.map((n) => {
        const active = n.match(pathname, type);
        return (
          <li key={n.href} className="relative">
            <Link
              href={n.href}
              aria-current={active ? "page" : undefined}
              className="relative block py-2 font-display text-[1.02rem] font-bold uppercase tracking-[0.06em] text-ink/80 transition-colors hover:text-ink"
            >
              {n.label}
              {active && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute inset-x-0 -bottom-0.5 h-[3px] bg-red"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function useBodyLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const results = useMemo(() => searchProducts(q, 6), [q]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const go = (query: string) => {
    onClose();
    router.push(`/shop?q=${encodeURIComponent(query)}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
      className="absolute inset-x-0 top-full z-40 border-b-2 border-ink bg-chalk shadow-[0_24px_48px_-24px_rgba(0,0,0,.35)]"
      role="dialog"
      aria-label="Search the store"
    >
      <div className="shell py-5 sm:py-7">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) go(q.trim());
          }}
          className="flex items-center gap-3 border-b-2 border-ink pb-2"
        >
          <SearchIcon size={26} className="shrink-0 text-ink/60" />
          <label htmlFor="site-search" className="sr-only">
            Search hats, teams and apparel
          </label>
          <input
            ref={inputRef}
            id="site-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && onClose()}
            placeholder="Search a team, a style, a colour…"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-2 font-display text-[clamp(1.6rem,4vw,2.6rem)] font-bold uppercase tracking-wide placeholder:text-stone focus:outline-none"
          />
          <button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full hover:bg-felt" aria-label="Close search">
            <CloseIcon />
          </button>
        </form>

        {q.trim() ? (
          <div className="mt-4" aria-live="polite">
            {results.length ? (
              <>
                <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {results.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/product/${p.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-3 rounded-sm p-2 transition-colors hover:bg-felt"
                      >
                        <span className="size-16 shrink-0 bg-felt">
                          <ProductArt type={p.type} colors={p.colorways[0].art} mark={p.mark} className="size-full" shadow={false} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{p.name}</span>
                          <span className="text-sm text-stone">
                            {TYPE_LABELS[p.type]} · {money(p.price)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => go(q.trim())} className="link mt-4 inline-flex items-center gap-2 font-semibold">
                  See every result for “{q.trim()}” <ArrowIcon size={18} />
                </button>
              </>
            ) : (
              <p className="py-4 text-stone">
                Nothing matches “{q.trim()}” online yet. The wall in the store carries far more than this site, so{" "}
                <a href={`tel:${site.phone.tel}`} className="link font-semibold text-ink">
                  call {site.phone.display}
                </a>{" "}
                and ask.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm text-stone">Try</span>
            {["Fitted", "49ers", "Warriors", "Beanie", "Trucker", "Hoodie"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setQ(t)}
                className="rounded-full border-[1.5px] border-ink/25 px-3.5 py-1.5 text-sm font-medium hover:border-ink"
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  useBodyLock(true);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <motion.div
        className="absolute inset-0 bg-ink/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.nav
        aria-label="Main"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 40 }}
        className="twill absolute inset-y-0 right-0 flex w-[min(26rem,100%)] flex-col overflow-y-auto bg-ink px-6 pb-8 text-bone"
      >
        <div className="flex h-16 items-center justify-between">
          <Link href="/" onClick={onClose} className="text-2xl" aria-label="HatWear home">
            <Wordmark tone="bone" />
          </Link>
          <button ref={closeRef} type="button" onClick={onClose} className="-mr-2 grid size-12 place-items-center" aria-label="Close menu">
            <CloseIcon size={26} />
          </button>
        </div>
        <Suspense fallback={<NavList pathname="" type={null} onNavigate={onClose} mobile />}>
          <NavLinks onNavigate={onClose} mobile />
        </Suspense>
        <div className="mt-auto pt-8">
          <p className="font-display text-xl font-bold uppercase tracking-wide">Visit the wall</p>
          <p className="mt-1 text-bone/70">
            {site.address.street}, {site.address.city}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a href={`tel:${site.phone.tel}`} className="btn btn-primary text-base">
              <PhoneIcon size={18} /> Call
            </a>
            <a href={mapLinks.google} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-ghost-light text-base">
              <PinIcon size={18} /> Directions
            </a>
          </div>
          <Link href="/wishlist" onClick={onClose} className="mt-5 flex items-center gap-2 text-bone/80 hover:text-bone">
            <HeartIcon size={18} /> Wishlist
          </Link>
          <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-bone/80 hover:text-bone">
            <InstagramIcon size={18} /> @{site.instagram.handle}
          </a>
        </div>
      </motion.nav>
    </motion.div>
  );
}

export function Header() {
  const { count, openCart, wishlist, hydrated } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    setSearchOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-bone/95 backdrop-blur supports-[backdrop-filter]:bg-bone/85">
      <div className="shell flex h-16 items-center gap-3 xl:h-[4.5rem]">
        <button
          type="button"
          className="-ml-2 grid size-11 place-items-center xl:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          <MenuIcon size={26} />
        </button>
        <Link href="/" className="text-[1.65rem] xl:text-[1.85rem]" aria-label="HatWear home">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="ml-auto hidden xl:block">
          <Suspense fallback={<NavList pathname="" type={null} />}>
            <NavLinks />
          </Suspense>
        </nav>
        <div className="ml-auto flex items-center xl:ml-4">
          <button
            type="button"
            onClick={() => setSearchOpen((o) => !o)}
            className="grid size-11 place-items-center rounded-full hover:bg-felt"
            aria-label="Search"
            aria-expanded={searchOpen}
          >
            <motion.span animate={{ rotate: searchOpen ? 90 : 0 }} className="grid place-items-center">
              {searchOpen ? <CloseIcon /> : <SearchIcon />}
            </motion.span>
          </button>
          <Link href="/wishlist" className="relative hidden size-11 place-items-center rounded-full hover:bg-felt sm:grid" aria-label={`Wishlist, ${wishlist.length} saved`}>
            <HeartIcon />
            {hydrated && wishlist.length > 0 && (
              <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-ink px-1 text-[0.72rem] font-bold leading-4 text-bone">
                {wishlist.length}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={openCart}
            className="relative -mr-2 grid size-11 place-items-center rounded-full hover:bg-felt"
            aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
          >
            <BagIcon />
            <AnimatePresence>
              {hydrated && count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 600, damping: 20 }}
                  className="absolute right-0.5 top-0.5 grid min-w-[1.15rem] place-items-center rounded-full bg-red px-1 text-[0.72rem] font-bold leading-[1.15rem] text-white"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
      <div className="stitch text-ink/60" aria-hidden="true" />
      <AnimatePresence>{searchOpen && <SearchPanel onClose={closeSearch} />}</AnimatePresence>
      <AnimatePresence>{menuOpen && <MobileMenu onClose={closeMenu} />}</AnimatePresence>
    </header>
  );
}
