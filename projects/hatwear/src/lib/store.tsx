"use client";

/**
 * Cart and wishlist state, persisted to localStorage.
 *
 * Line items store only ids (product, colourway, size) and quantity; prices
 * and names are always looked up from the catalog, so a stale browser cart
 * can never show an old price. When a commerce backend is connected, replace
 * the reducer's persistence with the backend's cart API (e.g. Shopify
 * cartCreate / cartLinesAdd) and keep this interface.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { getProductById, unitsFor } from "@/lib/catalog";
import type { Product } from "@/data/types";

export interface CartLine {
  productId: string;
  colorId: string;
  size: string;
  qty: number;
}

export interface ResolvedLine extends CartLine {
  key: string;
  product: Product;
  colorName: string;
  maxQty: number;
  lineTotal: number;
}

type State = { lines: CartLine[]; wishlist: string[]; hydrated: boolean };

type Action =
  | { type: "hydrate"; state: Partial<State> }
  | { type: "add"; line: CartLine; max: number }
  | { type: "setQty"; key: string; qty: number; max: number }
  | { type: "remove"; key: string }
  | { type: "clear" }
  | { type: "toggleWish"; id: string };

export const lineKey = (l: Pick<CartLine, "productId" | "colorId" | "size">) => `${l.productId}|${l.colorId}|${l.size}`;

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case "hydrate":
      return { ...state, ...a.state, hydrated: true };
    case "add": {
      const key = lineKey(a.line);
      const existing = state.lines.find((l) => lineKey(l) === key);
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((l) => (lineKey(l) === key ? { ...l, qty: Math.min(a.max, l.qty + a.line.qty) } : l)),
        };
      }
      return { ...state, lines: [...state.lines, { ...a.line, qty: Math.min(a.max, a.line.qty) }] };
    }
    case "setQty":
      return {
        ...state,
        lines: state.lines
          .map((l) => (lineKey(l) === a.key ? { ...l, qty: Math.max(0, Math.min(a.max, a.qty)) } : l))
          .filter((l) => l.qty > 0),
      };
    case "remove":
      return { ...state, lines: state.lines.filter((l) => lineKey(l) !== a.key) };
    case "clear":
      return { ...state, lines: [] };
    case "toggleWish":
      return {
        ...state,
        wishlist: state.wishlist.includes(a.id) ? state.wishlist.filter((x) => x !== a.id) : [...state.wishlist, a.id],
      };
  }
}

const STORAGE_KEY = "hatwear:v1";

interface StoreValue {
  lines: ResolvedLine[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  cartOpen: boolean;
  lastAdded: string | null;
  openCart: () => void;
  closeCart: () => void;
  add: (line: CartLine, opts?: { open?: boolean }) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  wishlist: string[];
  isWished: (id: string) => boolean;
  toggleWish: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [], wishlist: [], hydrated: false });
  const [cartOpen, setCartOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const skipSave = useRef(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const lines: CartLine[] = Array.isArray(parsed.lines)
        ? parsed.lines.filter(
            (l: CartLine) =>
              l && typeof l.qty === "number" && getProductById(l.productId)?.stock[l.colorId]?.[l.size] !== undefined,
          )
        : [];
      const wishlist: string[] = Array.isArray(parsed.wishlist) ? parsed.wishlist.filter((id: string) => getProductById(id)) : [];
      dispatch({ type: "hydrate", state: { lines, wishlist } });
    } catch {
      dispatch({ type: "hydrate", state: {} });
    }
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines: state.lines, wishlist: state.wishlist }));
    } catch {
      /* storage full or blocked: the cart still works for this visit */
    }
  }, [state.lines, state.wishlist, state.hydrated]);

  // Keep tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        dispatch({ type: "hydrate", state: { lines: parsed.lines ?? [], wishlist: parsed.wishlist ?? [] } });
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const lines = useMemo<ResolvedLine[]>(
    () =>
      state.lines.flatMap((l) => {
        const product = getProductById(l.productId);
        if (!product) return [];
        const color = product.colorways.find((c) => c.id === l.colorId);
        const maxQty = Math.max(0, unitsFor(product, l.colorId, l.size));
        return [{ ...l, key: lineKey(l), product, colorName: color?.name ?? "", maxQty, lineTotal: product.price * l.qty }];
      }),
    [state.lines],
  );

  const add = useCallback((line: CartLine, opts?: { open?: boolean }) => {
    const product = getProductById(line.productId);
    if (!product) return;
    const max = unitsFor(product, line.colorId, line.size);
    if (max <= 0) return;
    dispatch({ type: "add", line, max });
    setLastAdded(lineKey(line));
    if (opts?.open !== false) setCartOpen(true);
  }, []);

  const value: StoreValue = {
    lines,
    count: lines.reduce((n, l) => n + l.qty, 0),
    subtotal: lines.reduce((n, l) => n + l.lineTotal, 0),
    hydrated: state.hydrated,
    cartOpen,
    lastAdded,
    openCart: () => setCartOpen(true),
    closeCart: () => setCartOpen(false),
    add,
    setQty: (key, qty) => {
      const line = lines.find((l) => l.key === key);
      dispatch({ type: "setQty", key, qty, max: line?.maxQty ?? qty });
    },
    remove: (key) => dispatch({ type: "remove", key }),
    clear: () => dispatch({ type: "clear" }),
    wishlist: state.wishlist,
    isWished: (id) => state.wishlist.includes(id),
    toggleWish: (id) => dispatch({ type: "toggleWish", id }),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
