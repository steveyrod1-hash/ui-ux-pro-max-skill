"use client";

import Link from "next/link";
import Script from "next/script";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { money } from "@/lib/format";
import { cloverPublic } from "@/lib/clover/config";
import { fullAddress, mapLinks, site } from "@/content/site";
import { ProductMedia } from "../ProductMedia";
import { OpenNow } from "../OpenNow";
import { CheckIcon, PinIcon } from "../Icons";

/* Minimal typing for Clover's iframe SDK (https://docs.clover.com/dev/docs/using-the-clover-hosted-iframe). */
type CloverElement = { mount: (sel: string) => void; addEventListener: (ev: string, cb: (e: unknown) => void) => void; destroy?: () => void };
type CloverInstance = {
  elements: () => { create: (type: string, opts?: unknown) => CloverElement };
  createToken: () => Promise<{ token?: string; errors?: Record<string, string> }>;
};
declare global {
  interface Window {
    Clover?: new (key: string, opts: { merchantId: string; locale?: string }) => CloverInstance;
  }
}

type Quote = { subtotal: number; tax: number | null; total: number | null; lines: { key: string; unitPrice: number; qty: number; stock: number | null }[] };
type Status =
  | { s: "idle" }
  | { s: "paying" }
  | { s: "error"; message: string; lineKey?: string }
  | { s: "done"; orderId: string; amountPaid: number; brand?: string; last4?: string; name: string };

const FIELD_STYLES = {
  body: { fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", fontSize: "16px" },
  input: { fontSize: "16px", color: "#13233a" },
  "input::placeholder": { color: "#586a82" },
};

const CARD_FIELDS = [
  { type: "CARD_NUMBER", id: "card-number", label: "Card number", span: "col-span-6" },
  { type: "CARD_DATE", id: "card-date", label: "Expiry (MM/YY)", span: "col-span-2" },
  { type: "CARD_CVV", id: "card-cvv", label: "CVV", span: "col-span-2" },
  { type: "CARD_POSTAL_CODE", id: "card-postal-code", label: "ZIP code", span: "col-span-2" },
] as const;

export function CloverCheckout() {
  const { lines, subtotal, count, hydrated, clear, openCart } = useStore();
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkFailed, setSdkFailed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [custErrors, setCustErrors] = useState<Record<string, string>>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteErr, setQuoteErr] = useState<{ message: string; lineKey?: string } | null>(null);
  const [status, setStatus] = useState<Status>({ s: "idle" });
  const [honeypot, setHoneypot] = useState("");
  const clover = useRef<CloverInstance | null>(null);
  const gpay = useRef<CloverElement | null>(null);
  const idemKey = useRef<string | null>(null);

  const cartLines = useMemo(() => lines.map((l) => ({ productId: l.productId, colorId: l.colorId, size: l.size, qty: l.qty })), [lines]);
  const cartSig = JSON.stringify(cartLines);
  const total = quote?.total ?? null;

  // Live price/stock/tax check whenever the bag changes.
  useEffect(() => {
    if (!hydrated || cartLines.length === 0) return;
    let cancelled = false;
    setQuote(null);
    setQuoteErr(null);
    fetch("/api/checkout/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lines: cartLines }) })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (r.ok) setQuote(d);
        else setQuoteErr({ message: d.message ?? "We couldn't check prices with the store.", lineKey: d.lineKey });
      })
      .catch(() => !cancelled && setQuoteErr({ message: "We couldn't reach the store to check prices. Check your connection." }));
    return () => {
      cancelled = true;
    };
  }, [cartSig, hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateCustomer = useCallback(() => {
    const e: Record<string, string> = {};
    if (customer.name.trim().length < 2) e.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customer.email.trim())) e.email = "Enter a valid email for your receipt.";
    if (customer.phone.replace(/\D/g, "").length < 10) e.phone = "Enter a 10-digit phone number.";
    setCustErrors(e);
    return Object.keys(e).length === 0;
  }, [customer]);

  const pay = useCallback(
    async (token: string) => {
      setStatus({ s: "paying" });
      idemKey.current ??= crypto.randomUUID();
      try {
        const r = await fetch("/api/checkout/pay", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ lines: cartLines, customer, token, idempotencyKey: idemKey.current, website: honeypot }),
        });
        const d = await r.json().catch(() => ({}));
        if (r.ok) {
          idemKey.current = null;
          setStatus({ s: "done", orderId: d.orderId, amountPaid: d.amountPaid, brand: d.brand, last4: d.last4, name: customer.name.split(" ")[0] });
          clear();
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        // A definite answer from the server: the next attempt is a new payment.
        idemKey.current = null;
        if (d.errors) setCustErrors(d.errors);
        setStatus({ s: "error", message: d.message ?? "The payment didn't go through.", lineKey: d.lineKey });
      } catch {
        // Network failure: keep the same key so a retry can't charge twice.
        setStatus({ s: "error", message: "Connection lost while paying. Tap Pay again. You won't be charged twice." });
      }
    },
    [cartLines, customer, honeypot, clear],
  );

  // Mount Clover's secure card fields once the SDK has loaded.
  useEffect(() => {
    if (!sdkReady || !window.Clover || clover.current || status.s === "done") return;
    try {
      const c = new window.Clover(cloverPublic.publicKey, { merchantId: cloverPublic.merchantId });
      const elements = c.elements();
      for (const f of CARD_FIELDS) {
        const el = elements.create(f.type, FIELD_STYLES);
        el.mount(`#${f.id}`);
        const show = (ev: unknown) => {
          const info = (ev as Record<string, { error?: string; touched?: boolean }>)?.[f.type];
          setFieldErrors((prev) => ({ ...prev, [f.type]: info?.touched && info.error ? info.error : "" }));
        };
        el.addEventListener("change", show);
        el.addEventListener("blur", show);
      }
      clover.current = c;
    } catch (e) {
      console.error("[clover] iframe init failed", e);
      setSdkFailed(true);
    }
  }, [sdkReady, status.s]);

  // Google Pay button needs the final amount, so it's (re)created when the total is known.
  useEffect(() => {
    if (!clover.current || total === null || total <= 0) return;
    const container = document.getElementById("payment-request-button");
    if (!container) return;
    container.innerHTML = "";
    try {
      const btn = clover.current.elements().create("PAYMENT_REQUEST_BUTTON", {
        paymentReqData: { total: { label: "HatWear", amount: total }, options: { button: { buttonType: "short" } } },
      });
      btn.mount("#payment-request-button");
      btn.addEventListener("paymentMethod", (ev) => {
        const e = ev as { token?: string; tokenRecieved?: { id?: string }; data?: { token?: string } };
        const token = e?.token ?? e?.tokenRecieved?.id ?? e?.data?.token;
        if (!validateCustomer()) {
          setStatus({ s: "error", message: "Fill in your name, email and phone, then use Google Pay again." });
          return;
        }
        if (token) pay(token);
        else setStatus({ s: "error", message: "Google Pay didn't return a payment. Try again or pay by card." });
      });
      gpay.current = btn;
    } catch (e) {
      console.warn("[clover] Google Pay unavailable", e);
    }
  }, [total, sdkReady, pay, validateCustomer]);

  const submitCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status.s === "paying") return;
    const okCustomer = validateCustomer();
    if (!clover.current) {
      setStatus({ s: "error", message: "The secure card form is still loading. Give it a second and try again." });
      return;
    }
    const result = await clover.current.createToken();
    if (result.errors && Object.keys(result.errors).length) {
      setFieldErrors(Object.fromEntries(CARD_FIELDS.map((f) => [f.type, result.errors?.[f.type] ?? ""])));
      setStatus({ s: "error", message: "Check your card details." });
      return;
    }
    if (!okCustomer) {
      setStatus({ s: "error", message: "Some of your details need fixing." });
      return;
    }
    if (!result.token) {
      setStatus({ s: "error", message: "Your card couldn't be verified. Please re-enter it." });
      return;
    }
    pay(result.token);
  };

  if (status.s === "done") {
    return (
      <div className="shell pb-24 pt-10 sm:pt-14">
        <title>Order confirmed | HatWear Stockton</title>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="twill mx-auto max-w-2xl bg-ink p-8 text-bone sm:p-12">
          <span className="grid size-14 place-items-center rounded-full bg-sign text-white">
            <CheckIcon size={28} />
          </span>
          <h1 className="mt-5 text-[clamp(2.4rem,1.6rem+3vw,4rem)] uppercase">You're all set, {status.name}</h1>
          <p className="mt-3 text-lg text-bone/85">
            Paid {money(status.amountPaid / 100)}
            {status.last4 ? ` with ${status.brand ? `${status.brand} ` : ""}•••• ${status.last4}` : ""}. HatWear has your order and will let you know when it's ready to pick up.
          </p>
          <p className="mt-6 font-semibold">
            Order number <span className="font-display text-2xl tracking-wide">{status.orderId}</span>
          </p>
          <p className="text-sm text-bone/70">Show this at the counter when you pick up.</p>
          <div className="mt-8 border-t border-bone/20 pt-6">
            <p className="font-semibold">Pick up at</p>
            <p className="text-bone/85">
              {fullAddress} · Inside {site.locatedIn}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={mapLinks.google} target="_blank" rel="noopener noreferrer" className="btn bg-white text-ink hover:bg-chalk">
                <PinIcon size={18} /> Directions
              </a>
              <Link href="/shop" className="btn btn-ghost btn-ghost-light">
                Keep shopping
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!hydrated) return <div className="shell py-20"><div className="h-64 animate-pulse bg-felt" aria-busy="true" /></div>;
  if (lines.length === 0) {
    return (
      <div className="shell py-20 text-center">
        <title>Checkout | HatWear Stockton</title>
        <h1 className="text-5xl uppercase">Your bag is empty</h1>
        <Link href="/shop" className="btn btn-dark mt-6">
          Shop headwear
        </Link>
      </div>
    );
  }

  const paying = status.s === "paying";
  const blocked = !!quoteErr || sdkFailed;
  const errorLine = status.s === "error" ? status.lineKey : quoteErr?.lineKey;

  return (
    <div className="shell pb-24 pt-10 sm:pt-14">
      <title>Checkout | HatWear Stockton</title>
      <Script src={cloverPublic.sdkUrl} strategy="afterInteractive" onReady={() => setSdkReady(true)} onError={() => setSdkFailed(true)} />
      <h1 className="text-[clamp(2.4rem,1.4rem+4vw,4.6rem)] uppercase">Checkout</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
        <form onSubmit={submitCard} noValidate className="order-2 space-y-10 lg:order-1">
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </label>
          </div>

          <section aria-labelledby="co-details">
            <h2 id="co-details" className="text-2xl uppercase">1. Your details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["name", "Full name", "name", "text"],
                  ["phone", "Phone", "tel", "tel"],
                  ["email", "Email for your receipt", "email", "email"],
                ] as const
              ).map(([k, label, ac, type]) => (
                <div key={k} className={k === "email" ? "sm:col-span-2" : ""}>
                  <label htmlFor={`co-${k}`} className="font-semibold">
                    {label}
                  </label>
                  <input
                    id={`co-${k}`}
                    type={type}
                    autoComplete={ac}
                    inputMode={k === "phone" ? "tel" : undefined}
                    value={customer[k]}
                    onChange={(e) => {
                      setCustomer((c) => ({ ...c, [k]: e.target.value }));
                      setCustErrors((x) => ({ ...x, [k]: "" }));
                    }}
                    className="field mt-1.5"
                    aria-invalid={!!custErrors[k]}
                    aria-describedby={custErrors[k] ? `co-${k}-err` : undefined}
                  />
                  {custErrors[k] && (
                    <p id={`co-${k}-err`} role="alert" className="mt-1 text-sm font-semibold text-sign-deep">
                      {custErrors[k]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="co-pickup">
            <h2 id="co-pickup" className="text-2xl uppercase">2. Pickup</h2>
            <div className="mt-4 border-[1.5px] border-ink bg-chalk p-5">
              <p className="font-semibold">In-store pickup · Free</p>
              <p className="mt-1 text-graphite">
                {fullAddress}
                <br />
                Inside {site.locatedIn} · {site.landmark}
              </p>
              <div className="mt-3">
                <OpenNow />
              </div>
              <p className="mt-2 text-sm text-stone">HatWear will let you know when your order is ready.</p>
            </div>
          </section>

          <section aria-labelledby="co-pay">
            <h2 id="co-pay" className="text-2xl uppercase">3. Payment</h2>
            <div id="payment-request-button" className="mt-4 min-h-0 empty:hidden [&:not(:empty)]:h-12" />
            <div className="mt-4 grid grid-cols-6 gap-3">
              {CARD_FIELDS.map((f) => (
                <div key={f.id} className={f.span}>
                  <span className="font-semibold" id={`${f.id}-label`}>
                    {f.label}
                  </span>
                  <div
                    id={f.id}
                    aria-labelledby={`${f.id}-label`}
                    className={`mt-1.5 h-12 overflow-hidden rounded-[2px] border-[1.5px] bg-white px-3 py-1 ${fieldErrors[f.type] ? "border-sign" : "border-[#b6c2d1]"}`}
                  />
                  {fieldErrors[f.type] && (
                    <p role="alert" className="mt-1 text-sm font-semibold text-sign-deep">
                      {fieldErrors[f.type]}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {!sdkReady && !sdkFailed && <p className="mt-2 text-sm text-stone">Loading the secure card form…</p>}
            {sdkFailed && (
              <p role="alert" className="mt-3 border-l-4 border-sign bg-chalk p-3 font-semibold">
                The secure card form didn't load. Check your connection and refresh, or call {site.phone.display} to order.
              </p>
            )}
            <p className="mt-3 text-sm text-stone">Card details are entered in Clover's secure form and go straight to Clover. They never touch this website.</p>
          </section>

          <AnimatePresence>
            {status.s === "error" && (
              <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert" className="border-l-4 border-sign bg-chalk p-4 font-semibold">
                {status.message}
              </motion.p>
            )}
          </AnimatePresence>

          <button type="submit" disabled={paying || blocked || !quote} className="btn btn-primary w-full text-lg">
            {paying ? "Processing payment…" : total !== null ? `Pay ${money(total / 100)}` : quote ? `Pay ${money(quote.subtotal / 100)} + tax` : "Checking prices…"}
          </button>
          <p className="-mt-6 text-center text-sm text-stone">By paying you agree to pick up your order at the store.</p>
        </form>

        <aside className="order-1 h-fit bg-chalk p-5 sm:p-6 lg:sticky lg:top-24 lg:order-2" aria-labelledby="co-summary">
          <h2 id="co-summary" className="text-2xl uppercase">
            Order · {count} {count === 1 ? "item" : "items"}
          </h2>
          <ul className="mt-4 divide-y divide-ink/10">
            {lines.map((l) => {
              const live = quote?.lines.find((x) => x.key === l.key);
              const unit = live ? live.unitPrice / 100 : l.product.price;
              return (
                <li key={l.key} className={`flex gap-3 py-3 ${errorLine === l.key ? "bg-sign/10" : ""}`}>
                  <span className="size-16 shrink-0 bg-felt">
                    <ProductMedia product={l.product} colorId={l.colorId} className="size-full" shadow={false} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{l.product.name}</span>
                    <span className="text-sm text-stone">
                      {l.colorName} · {l.size} · Qty {l.qty}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">{money(unit * l.qty)}</span>
                </li>
              );
            })}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t-2 border-ink pt-4">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{money((quote?.subtotal ?? subtotal * 100) / 100)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Sales tax</dt>
              <dd className="tabular-nums">{quote ? (quote.tax !== null ? money(quote.tax / 100) : "Added at payment") : "…"}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Pickup</dt>
              <dd>Free</dd>
            </div>
            <div className="flex justify-between pt-2 text-xl font-black">
              <dt className="font-display uppercase">Total</dt>
              <dd className="tabular-nums">{total !== null ? money(total / 100) : "…"}</dd>
            </div>
          </dl>
          {quoteErr && (
            <div role="alert" className="mt-4 border-l-4 border-sign bg-white p-3">
              <p className="font-semibold">{quoteErr.message}</p>
              <button type="button" onClick={openCart} className="link mt-1 inline-block text-sm font-semibold">
                Edit your bag
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
