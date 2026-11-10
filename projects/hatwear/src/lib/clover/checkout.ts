import "server-only";
import { getProductById } from "@/lib/catalog";
import { cloverServerConfig } from "./config";
import { CloverError, ecomm, rest } from "./api";

export interface CartLineInput {
  productId: string;
  colorId: string;
  size: string;
  qty: number;
}

export interface CustomerInput {
  name: string;
  email: string;
  phone: string;
}

export class CheckoutError extends Error {
  constructor(
    message: string,
    public status = 400,
    public lineKey?: string,
  ) {
    super(message);
  }
}

const MAX_UNITS = 30;

interface CloverItem {
  id: string;
  name: string;
  price?: number;
  hidden?: boolean;
  available?: boolean;
  itemStock?: { quantity?: number };
}

export interface ResolvedLine extends CartLineInput {
  itemId: string;
  name: string;
  unitPrice: number; // cents, from Clover right now
  stock: number | null; // null when Clover doesn't track stock for the item
}

/** Re-reads every cart line from Clover: real price, availability and stock. */
export async function resolveLines(lines: CartLineInput[]): Promise<ResolvedLine[]> {
  if (!Array.isArray(lines) || lines.length === 0) throw new CheckoutError("Your bag is empty.");
  if (lines.length > 20) throw new CheckoutError("That's a lot of items for one online order. Please call the store.");
  const units = lines.reduce((n, l) => n + (Number(l.qty) || 0), 0);
  if (units > MAX_UNITS) throw new CheckoutError(`Online orders are limited to ${MAX_UNITS} items. Call the store for bigger orders.`);

  return Promise.all(
    lines.map(async (l) => {
      const key = `${l.productId}|${l.colorId}|${l.size}`;
      const qty = Math.floor(Number(l.qty));
      if (!(qty >= 1)) throw new CheckoutError("Each item needs a quantity of at least 1.", 400, key);
      const product = getProductById(String(l.productId));
      const itemId = product?.variantIds?.[l.colorId]?.[l.size];
      if (!product || !itemId) throw new CheckoutError("One of the items in your bag isn't sold online anymore. Remove it and try again.", 409, key);

      let item: CloverItem;
      try {
        item = await rest<CloverItem>(`/items/${encodeURIComponent(itemId)}?expand=itemStock`);
      } catch (e) {
        if (e instanceof CloverError && e.status === 404) throw new CheckoutError(`${product.name} isn't available online anymore.`, 409, key);
        throw e;
      }
      if (item.hidden || item.available === false || !(item.price && item.price > 0))
        throw new CheckoutError(`${product.name} isn't available online right now.`, 409, key);
      const stock = item.itemStock ? Math.max(0, Math.floor(item.itemStock.quantity ?? 0)) : null;
      if (stock !== null && stock < qty)
        throw new CheckoutError(
          stock === 0 ? `${product.name} (${l.size}) just sold out.` : `Only ${stock} left of ${product.name} (${l.size}). Lower the quantity and try again.`,
          409,
          key,
        );
      return { ...l, qty, itemId, name: product.name, unitPrice: item.price, stock };
    }),
  );
}

function orderCart(lines: ResolvedLine[], note?: string) {
  const c = cloverServerConfig();
  return {
    // Clover line items are one per unit for fixed-price inventory items.
    lineItems: lines.flatMap((l) => Array.from({ length: l.qty }, () => ({ item: { id: l.itemId } }))),
    ...(c.orderTypeId ? { orderType: { id: c.orderTypeId } } : {}),
    ...(note ? { note } : {}),
  };
}

type Totals = { subtotal: number; tax: number | null; total: number | null };

/** Reads totals from Clover's atomic order response, whatever its exact shape. */
function totalsFrom(res: Record<string, unknown>, subtotal: number): Totals {
  const num = (...vals: unknown[]) => vals.find((v) => typeof v === "number") as number | undefined;
  const cart = (res.orderCart ?? {}) as Record<string, unknown>;
  const total = num(res.total, cart.total, (res.summary as Record<string, unknown> | undefined)?.total);
  const tax = num(res.tax, res.taxAmount, res.totalTax, cart.tax, cart.taxAmount) ?? (total !== undefined ? total - subtotal : undefined);
  return { subtotal, tax: tax ?? null, total: total ?? null };
}

/** Price check before paying: Clover computes tax from the store's own tax settings. */
export async function quote(lines: CartLineInput[]) {
  const resolved = await resolveLines(lines);
  const subtotal = resolved.reduce((n, l) => n + l.unitPrice * l.qty, 0);
  let totals: Totals = { subtotal, tax: null, total: null };
  try {
    const res = await rest<Record<string, unknown>>("/atomic_order/checkouts", { method: "POST", body: { orderCart: orderCart(resolved) } });
    totals = totalsFrom(res, subtotal);
  } catch (e) {
    // The quote still works without Clover's tax preview; the charge uses Clover's real total.
    console.warn("[clover] checkout preview failed", e instanceof Error ? e.message : e);
  }
  return {
    ...totals,
    lines: resolved.map((l) => ({ key: `${l.productId}|${l.colorId}|${l.size}`, unitPrice: l.unitPrice, qty: l.qty, stock: l.stock })),
  };
}

// Same idempotency key → same result, so a retried request never charges twice
// (Clover also deduplicates the payment itself by the same key).
const inflight = new Map<string, Promise<PayResult>>();

export interface PayResult {
  orderId: string;
  amountPaid: number; // cents
  brand?: string;
  last4?: string;
}

const DECLINE_MESSAGES: Record<string, string> = {
  insufficient_funds: "Your card was declined for insufficient funds. Try another card.",
  expired_card: "That card has expired. Try another card.",
  incorrect_cvc: "The security code (CVV) is incorrect.",
  incorrect_zip: "The ZIP code doesn't match the card.",
  card_declined: "Your card was declined. Try another card or call your bank.",
};

export function payForCart(input: {
  lines: CartLineInput[];
  customer: CustomerInput;
  token: string;
  idempotencyKey: string;
  clientIp?: string;
}): Promise<PayResult> {
  const existing = inflight.get(input.idempotencyKey);
  if (existing) return existing;
  const p = doPay(input);
  inflight.set(input.idempotencyKey, p);
  p.catch(() => inflight.delete(input.idempotencyKey)); // failures may be retried with the same key
  setTimeout(() => inflight.delete(input.idempotencyKey), 30 * 60_000).unref?.();
  return p;
}

async function doPay({ lines, customer, token, idempotencyKey, clientIp }: Parameters<typeof payForCart>[0]): Promise<PayResult> {
  const c = cloverServerConfig();
  const resolved = await resolveLines(lines);
  const note = `Website order · In-store pickup · ${customer.name} · ${customer.phone} · ${customer.email}`.slice(0, 255);

  const order = await rest<{ id: string; total?: number }>("/atomic_order/orders", { method: "POST", body: { orderCart: orderCart(resolved, note) } });
  if (!order?.id) throw new CheckoutError("Clover didn't create the order. Nothing was charged. Please try again.", 502);

  try {
    const paid = await ecomm<{ id: string; status?: string; amount_paid?: number; amount?: number; source?: { brand?: string; last4?: string } }>(
      `/v1/orders/${encodeURIComponent(order.id)}/pay`,
      { method: "POST", body: { source: token, email: customer.email, ecomind: "ecom" }, idempotencyKey, clientIp },
    );
    if (paid.status && paid.status !== "paid") throw new CheckoutError("The payment didn't complete. Nothing was charged. Please try again.", 402);

    if (c.decrementStock) {
      await Promise.all(
        resolved
          .filter((l) => l.stock !== null)
          .map((l) => rest(`/item_stocks/${encodeURIComponent(l.itemId)}`, { method: "POST", body: { quantity: Math.max(0, (l.stock ?? 0) - l.qty) } }).catch((e) => console.error("[clover] stock update failed", l.itemId, e))),
      );
    }
    return { orderId: order.id, amountPaid: paid.amount_paid ?? paid.amount ?? order.total ?? 0, brand: paid.source?.brand, last4: paid.source?.last4 };
  } catch (e) {
    // Don't leave an unpaid order behind in Clover.
    await rest(`/orders/${encodeURIComponent(order.id)}`, { method: "DELETE" }).catch(() => {});
    if (e instanceof CloverError) {
      const msg = (e.declineCode && DECLINE_MESSAGES[e.declineCode]) || (e.code && DECLINE_MESSAGES[e.code]);
      throw new CheckoutError(msg ?? (e.status >= 500 ? "Clover is having trouble right now. Nothing was charged. Please try again shortly." : `The payment didn't go through: ${e.message}`), e.status >= 500 ? 502 : 402);
    }
    throw e;
  }
}
