/**
 * Clover settings, read from environment variables only. Nothing secret is
 * ever written in code. See README → "Connect Clover" for where each value
 * comes from in the Clover dashboard.
 *
 * Server-only:
 *   CLOVER_ENV                 "sandbox" (default) or "production"
 *   CLOVER_MERCHANT_ID         the merchant ID (mId)
 *   CLOVER_API_TOKEN           REST API token with Inventory + Orders permissions
 *   CLOVER_ECOMM_PRIVATE_KEY   Ecommerce private key (Hosted iFrame + API/SDK)
 *   CLOVER_ORDER_TYPE_ID       optional: order type for website pickup orders
 *   CLOVER_ONLINE_CATEGORY     optional: only items in this category appear online
 *   CLOVER_DECREMENT_STOCK     optional: "1" to lower stock explicitly after payment
 *
 * Public (needed by the payment form in the browser; safe to expose):
 *   NEXT_PUBLIC_CLOVER_PUBLIC_KEY    Ecommerce public key / apiAccessKey
 *   NEXT_PUBLIC_CLOVER_MERCHANT_ID   same merchant ID
 *   NEXT_PUBLIC_CLOVER_ENV           "sandbox" or "production"
 */

export type CloverEnv = "sandbox" | "production";

const HOSTS: Record<CloverEnv, { rest: string; ecomm: string; sdk: string }> = {
  sandbox: {
    rest: "https://apisandbox.dev.clover.com",
    ecomm: "https://scl-sandbox.dev.clover.com",
    sdk: "https://checkout.sandbox.dev.clover.com/sdk.js",
  },
  production: {
    rest: "https://api.clover.com",
    ecomm: "https://scl.clover.com",
    sdk: "https://checkout.clover.com/sdk.js",
  },
};

const envName = (v: string | undefined): CloverEnv => (v === "production" ? "production" : "sandbox");

export function cloverServerConfig() {
  const env = envName(process.env.CLOVER_ENV);
  const merchantId = process.env.CLOVER_MERCHANT_ID ?? "";
  const apiToken = process.env.CLOVER_API_TOKEN ?? "";
  const ecommPrivateKey = process.env.CLOVER_ECOMM_PRIVATE_KEY ?? "";
  return {
    env,
    merchantId,
    apiToken,
    ecommPrivateKey,
    // Overridable for automated tests against a local mock server.
    restBase: process.env.CLOVER_REST_BASE || HOSTS[env].rest,
    ecommBase: process.env.CLOVER_ECOMM_BASE || HOSTS[env].ecomm,
    orderTypeId: process.env.CLOVER_ORDER_TYPE_ID || "",
    onlineCategory: process.env.CLOVER_ONLINE_CATEGORY || "",
    decrementStock: process.env.CLOVER_DECREMENT_STOCK === "1",
    catalogReady: !!(merchantId && apiToken),
    checkoutReady: !!(merchantId && apiToken && ecommPrivateKey),
  };
}

/** What the browser needs to load Clover's payment form. Inlined at build time. */
export const cloverPublic = {
  publicKey: process.env.NEXT_PUBLIC_CLOVER_PUBLIC_KEY ?? "",
  merchantId: process.env.NEXT_PUBLIC_CLOVER_MERCHANT_ID ?? "",
  env: envName(process.env.NEXT_PUBLIC_CLOVER_ENV),
  get sdkUrl() {
    // Override only for automated tests (a local stand-in for Clover's SDK).
    return process.env.NEXT_PUBLIC_CLOVER_SDK_URL || HOSTS[this.env].sdk;
  },
  get enabled() {
    return !!(this.publicKey && this.merchantId);
  },
};
