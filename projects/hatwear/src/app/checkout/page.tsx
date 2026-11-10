"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { money, plural } from "@/lib/format";
import { ProductMedia } from "@/components/ProductMedia";
import { CheckIcon, PhoneIcon } from "@/components/Icons";
import { DEMO_CATALOG, DEMO_CHECKOUT, site } from "@/content/site";
import { CloverCheckout } from "@/components/checkout/CloverCheckout";

/**
 * Checkout. In demo mode nothing is charged or submitted: the page lets the
 * customer send their list to the store instead. To go live, replace the
 * "Payment" section with the commerce provider's hosted checkout (see README).
 */
function DemoCheckout() {
  const { lines, subtotal, count, hydrated } = useStore();
  const [copied, setCopied] = useState(false);

  const summary = [
    "HatWear order list",
    ...lines.map((l) => `• ${l.qty} × ${l.product.name} (${l.colorName}, ${l.size}) ${money(l.lineTotal)}`),
    `Subtotal: ${money(subtotal)}${DEMO_CATALOG ? " (sample prices)" : ""}`,
  ].join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

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

  return (
    <div className="shell pb-24 pt-10 sm:pt-14">
      <title>Checkout | HatWear Stockton</title>
      <h1 className="text-[clamp(2.8rem,1.6rem+5vw,6rem)] uppercase">Review your order</h1>

      {DEMO_CHECKOUT && (
        <div className="mt-6 border-l-4 border-sign bg-chalk p-5" role="note">
          <p className="font-display text-2xl font-black uppercase">Online payment isn't connected yet</p>
          <p className="mt-1 max-w-2xl text-graphite">
            This is a preview of the shop. Nothing is charged and no order is placed from this page. To get these items, send the list to the store or call, and HatWear will confirm stock and price with you.
          </p>
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="items-title">
          <h2 id="items-title" className="text-3xl uppercase">
            {plural(count, "item")}
          </h2>
          <ul className="mt-4 border-t-2 border-ink">
            {lines.map((l) => (
              <li key={l.key} className="flex gap-4 border-b border-ink/15 py-4">
                <span className="size-20 shrink-0 bg-felt">
                  <ProductMedia product={l.product} colorId={l.colorId} className="size-full" shadow={false} />
                </span>
                <div className="flex-1">
                  <p className="font-semibold">{l.product.name}</p>
                  <p className="text-sm text-stone">
                    {l.colorName} · {l.size} · Qty {l.qty}
                  </p>
                </div>
                <p className="font-semibold tabular-nums">{money(l.lineTotal)}</p>
              </li>
            ))}
          </ul>
        </section>

        <aside className="h-fit bg-chalk p-6" aria-labelledby="sum-title">
          <h2 id="sum-title" className="text-3xl uppercase">
            Summary
          </h2>
          <dl className="mt-4 space-y-2">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="font-semibold tabular-nums">{money(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-stone">
              <dt>Tax</dt>
              <dd>Calculated by the store</dd>
            </div>
          </dl>
          {DEMO_CATALOG && <p className="mt-3 text-sm text-stone">Prices shown are sample prices.</p>}
          <div className="stitch my-5 text-ink/40" aria-hidden="true" />

          <h3 className="font-sans text-base font-semibold tracking-normal">Send this list to the store</h3>
          <div className="mt-3 grid gap-2">
            <a href={`sms:${site.phone.tel}?&body=${encodeURIComponent(summary)}`} className="btn btn-primary">
              Text it to HatWear
            </a>
            <button type="button" onClick={copy} className="btn btn-ghost btn-ghost-dark">
              {copied ? (
                <>
                  <CheckIcon size={18} /> Copied
                </>
              ) : (
                "Copy the list"
              )}
            </button>
            <a href={`tel:${site.phone.tel}`} className="btn btn-ghost btn-ghost-dark">
              <PhoneIcon size={18} /> Call {site.phone.display}
            </a>
          </div>
          <p className="mt-4 text-sm text-stone" aria-live="polite">
            {copied ? "Order list copied. Paste it into a message to the store." : "Texting opens your messages app with the list filled in."}
          </p>

          <fieldset disabled className="mt-6 rounded-sm border border-dashed border-ink/30 p-4 opacity-70">
            <legend className="px-1 text-sm font-semibold">Payment (coming soon)</legend>
            <p className="text-sm text-stone">Card payment will appear here once the store connects a payment provider.</p>
          </fieldset>
        </aside>
      </div>
    </div>
  );
}

/** Live Clover checkout once the public key is configured; the demo page until then. */
export default function CheckoutPage() {
  return DEMO_CHECKOUT ? <DemoCheckout /> : <CloverCheckout />;
}
