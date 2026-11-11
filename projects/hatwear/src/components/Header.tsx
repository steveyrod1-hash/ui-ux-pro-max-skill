"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Wordmark } from "./Brand";
import { BagIcon, CloseIcon, HeartIcon, MenuIcon, PhoneIcon, PinIcon, SearchIcon, ArrowIcon, InstagramIcon, ChevronIcon } from "./Icons";
import { GROUP_LINKS, ShopMenu, TeamsMenu } from "./MegaMenu";
import { STYLE_GROUPS, STYLES } from "@/data/styles";
import { ProductArt } from "./ProductArt";
import { useStore } from "@/lib/store";
import { LEAGUES, searchProducts, styleCounts, TEAMS_BY_LEAGUE, TYPE_LABELS } from "@/lib/catalog";
import { money } from "@/lib/format";
import { activeDeals, priceFor } from "@/lib/deals";
import { useNow } from "@/lib/use-now";
import { mapLinks, site } from "@/content/site";

type MenuId = "shop" | "teams";
type NavItem = { label: string; href: string; menu?: MenuId; deals?: boolean; match: (p: string, q: URLSearchParams) => boolean };

const onShop = (p: string, q: URLSearchParams, type: string) => p === "/shop" && q.get("type") === type;

export const NAV: NavItem[] = [
  {
    label: "Shop",
    href: "/shop",
    menu: "shop",
    match: (p, q) => p === "/shop" && !q.get("team") && !q.get("league"),
  },
  { label: "Deals", href: "/deals", deals: true, match: (p) => p.startsWith("/deals") },
  { label: "Custom Embroidery", href: "/custom", match: (p) => p.startsWith("/custom") },
  { label: "Teams", href: "/teams", menu: "teams", match: (p, q) => p.startsWith("/teams") || (p === "/shop" && !!(q.get("team") || q.get("league"))) },
  { label: "About", href: "/store", match: (p) => p.startsWith("/store") },
];

type NavProps = {
  onNavigate?: () => void;
  mobile?: boolean;
  openMenu?: MenuId | null;
  onMenu?: (m: MenuId | null, how?: "hover" | "click") => void;
};

function NavLinks(props: NavProps) {
  const pathname = usePathname();
  const query = useSearchParams();
  return <NavList pathname={pathname} query={new URLSearchParams(query.toString())} {...props} />;
}

function MobileShopMenu({ onNavigate }: { onNavigate?: () => void }) {
  const counts = styleCounts();
  return (
    <div className="space-y-5 pb-5 pt-1">
      {STYLE_GROUPS.map((g) => (
        <div key={g.id}>
          <Link href={GROUP_LINKS[g.id].href} onClick={onNavigate} className="inline-flex items-center gap-2 font-display text-lg font-black uppercase">
            {g.label} <ArrowIcon size={16} className="text-bone/50" />
          </Link>
          <ul className="mt-2 flex flex-wrap gap-2">
            {STYLES.filter((s) => s.group === g.id).map((s) => (
              <li key={s.id}>
                <Link href={`/shop?style=${s.id}`} onClick={onNavigate} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-bone/25 px-3.5 text-sm hover:border-bone">
                  {s.label}
                  {counts[s.id] ? <span className="text-xs text-bone/50">{counts[s.id]}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <Link href="/shop" onClick={onNavigate} className="link inline-flex items-center gap-2 font-semibold">
        Shop everything <ArrowIcon size={16} />
      </Link>
    </div>
  );
}

function MobileTeamsMenu({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="space-y-5 pb-5 pt-1">
      {LEAGUES.map((l) => (
        <div key={l}>
          <Link href={`/shop?league=${l}`} onClick={onNavigate} className="inline-flex items-center gap-2 font-display text-lg font-black uppercase">
            {l} <ArrowIcon size={16} className="text-bone/50" />
          </Link>
          <ul className="mt-1 grid grid-cols-2 gap-x-3">
            {TEAMS_BY_LEAGUE[l].map((t) => (
              <li key={t}>
                <Link href={`/shop?team=${encodeURIComponent(t)}`} onClick={onNavigate} className="block py-2 text-sm text-bone/85 hover:text-bone">
                  {t}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function NavList({ pathname, query, onNavigate, mobile, openMenu, onMenu }: NavProps & { pathname: string; query: URLSearchParams }) {
  const [expanded, setExpanded] = useState<MenuId | null>(null);
  const hasDeals = activeDeals(useNow()).length > 0;
  const items = NAV.filter((n) => !n.deals || hasDeals);
  if (mobile) {
    return (
      <ul className="flex flex-col">
        {items.map((n, i) => {
          const active = n.match(pathname, query);
          const rowCls = "group flex w-full items-center justify-between border-b border-bone/12 py-3.5 font-display text-[1.7rem] font-extrabold uppercase leading-none";
          return (
            <motion.li key={n.href} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 + i * 0.04, type: "spring", stiffness: 420, damping: 36 }}>
              {n.menu ? (
                <>
                  <button type="button" onClick={() => setExpanded((x) => (x === n.menu ? null : n.menu!))} aria-expanded={expanded === n.menu} className={rowCls}>
                    <span className={active ? "text-sign-light" : ""}>{n.label}</span>
                    <ChevronIcon size={22} className={`text-bone/60 transition-transform ${expanded === n.menu ? "rotate-90" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {expanded === n.menu && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden border-b border-bone/12">
                        {n.menu === "shop" ? <MobileShopMenu onNavigate={onNavigate} /> : <MobileTeamsMenu onNavigate={onNavigate} />}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <Link href={n.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={rowCls}>
                  <span className={active ? "text-sign-light" : ""}>{n.label}</span>
                  <ArrowIcon size={22} className="text-bone/40 transition-transform group-hover:translate-x-1 group-hover:text-bone" />
                </Link>
              )}
            </motion.li>
          );
        })}
      </ul>
    );
  }
  const itemCls = "relative inline-flex min-h-11 items-center gap-1 whitespace-nowrap px-1 font-sans text-[0.95rem] font-semibold text-ink/80 transition-colors hover:text-ink";
  return (
    <ul className="flex items-center justify-center gap-[clamp(1.25rem,2.6vw,2.75rem)]">
      {items.map((n) => {
        const active = n.match(pathname, query);
        const underline = active && (
          <motion.span layoutId="nav-underline" className="absolute inset-x-1 bottom-1 h-[2.5px] rounded-full bg-sign" transition={{ type: "spring", stiffness: 500, damping: 40 }} />
        );
        return (
          <li key={n.href} className="relative" onPointerEnter={(e) => e.pointerType === "mouse" && onMenu?.(n.menu ?? null, "hover")}>
            {n.menu ? (
              <button
                type="button"
                className={itemCls}
                aria-expanded={openMenu === n.menu}
                aria-controls={`menu-${n.menu}`}
                aria-haspopup="true"
                onClick={() => onMenu?.(openMenu === n.menu ? null : n.menu!, "click")}
              >
                {n.label}
                <ChevronIcon size={14} className={`transition-transform ${openMenu === n.menu ? "-rotate-90" : "rotate-90"}`} />
                {underline}
              </button>
            ) : (
              <Link href={n.href} aria-current={active ? "page" : undefined} className={`${itemCls} ${n.deals ? "!text-sign" : ""}`}>
                {n.label}
                {underline}
              </Link>
            )}
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
                            {TYPE_LABELS[p.type]} · {money(priceFor(p).price)}
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

  // Rendered into <body>: the header's backdrop blur would otherwise trap this
  // fixed-position sheet inside the header's own box.
  return createPortal(
    <motion.div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
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
        className="navy-stage absolute inset-y-0 right-0 flex w-[min(26rem,100%)] flex-col overflow-y-auto px-6 pb-[max(2rem,env(safe-area-inset-bottom))] text-bone"
      >
        <div className="flex h-16 items-center justify-between">
          <Link href="/" onClick={onClose} className="text-2xl" aria-label="HatWear home">
            <Wordmark tone="bone" />
          </Link>
          <button ref={closeRef} type="button" onClick={onClose} className="-mr-2 grid size-12 place-items-center" aria-label="Close menu">
            <CloseIcon size={26} />
          </button>
        </div>
        <Suspense fallback={<NavList pathname="" query={new URLSearchParams()} onNavigate={onClose} mobile />}>
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
    </motion.div>,
    document.body,
  );
}

export function Header() {
  const { count, openCart, wishlist, hydrated } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeMenus = useCallback(() => setOpenMenu(null), []);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hover opens after a short pause (no flicker when the pointer passes over); clicks are instant.
  const onMenu = useCallback((m: MenuId | null, how: "hover" | "click" = "click") => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (how === "click") {
      setOpenMenu(m);
      if (m) setSearchOpen(false);
      return;
    }
    hoverTimer.current = setTimeout(() => {
      setOpenMenu((cur) => (m === null && cur === null ? cur : m));
      if (m) setSearchOpen(false);
    }, m ? 110 : 160);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setMenuOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    if (!openMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenMenu(null);
      document.querySelector<HTMLElement>(`[aria-controls="menu-${openMenu}"]`)?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openMenu]);

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
    <header
      className={`sticky top-0 z-40 border-b bg-bone/95 backdrop-blur transition-shadow duration-300 supports-[backdrop-filter]:bg-bone/88 ${
        scrolled ? "border-ink/10 shadow-[0_8px_24px_-16px_rgba(11,31,58,.35)]" : "border-ink/8"
      }`}
      onPointerLeave={(e) => e.pointerType === "mouse" && openMenu && onMenu(null, "hover")}
    >
      <div className="shell flex h-16 items-center gap-3 lg:grid lg:h-[4.75rem] lg:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="justify-self-start text-[1.45rem] min-[400px]:text-[1.6rem] lg:text-[1.9rem]" aria-label="HatWear home">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <Suspense fallback={<NavList pathname="" query={new URLSearchParams()} openMenu={openMenu} onMenu={onMenu} />}>
            <NavLinks openMenu={openMenu} onMenu={onMenu} />
          </Suspense>
        </nav>
        <div className="-mr-2 ml-auto flex items-center justify-self-end lg:ml-0">
          <button
            type="button"
            onClick={() => {
              setOpenMenu(null);
              setSearchOpen((o) => !o);
            }}
            className="grid size-11 place-items-center rounded-full transition-colors hover:bg-felt"
            aria-label="Search"
            aria-expanded={searchOpen}
          >
            <motion.span animate={{ rotate: searchOpen ? 90 : 0 }} className="grid place-items-center">
              {searchOpen ? <CloseIcon size={24} /> : <SearchIcon size={24} />}
            </motion.span>
          </button>
          <Link href="/wishlist" className="relative hidden size-11 place-items-center rounded-full transition-colors hover:bg-felt sm:grid" aria-label={`Wishlist, ${wishlist.length} saved`}>
            <HeartIcon size={24} />
            {hydrated && wishlist.length > 0 && (
              <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-ink px-1 text-[0.72rem] font-bold leading-4 text-bone">
                {wishlist.length}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={openCart}
            className="relative grid size-11 place-items-center rounded-full transition-colors hover:bg-felt"
            aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
          >
            <BagIcon size={24} />
            <AnimatePresence>
              {hydrated && count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 600, damping: 20 }}
                  className="absolute right-0.5 top-0.5 grid min-w-[1.15rem] place-items-center rounded-full bg-sign px-1 text-[0.72rem] font-bold leading-[1.15rem] text-white"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full transition-colors hover:bg-felt"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <MenuIcon size={26} />
          </button>
        </div>
      </div>
      <AnimatePresence>{searchOpen && <SearchPanel onClose={closeSearch} />}</AnimatePresence>
      <AnimatePresence>
        {openMenu === "shop" && <ShopMenu id="menu-shop" key="shop" onNavigate={closeMenus} />}
        {openMenu === "teams" && <TeamsMenu id="menu-teams" key="teams" onNavigate={closeMenus} />}
      </AnimatePresence>
      <AnimatePresence>{menuOpen && <MobileMenu onClose={closeMenu} />}</AnimatePresence>
    </header>
  );
}
