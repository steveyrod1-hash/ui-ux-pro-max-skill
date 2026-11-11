/**
 * Clover integration test: catalog sync, live price/stock checks, Clover tax,
 * paying for an order, idempotent retries, declines and the browser checkout,
 * all against the local stand-in in tests/clover-mock.mjs.
 *
 *   npm run test:clover        (needs Playwright + Chromium, like test:e2e)
 *
 * It builds into .next-clover/ and resets src/data/clover-raw.generated.json
 * to preview mode afterwards.
 */
import { createRequire } from "node:module";
import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startMock, MID, REST_TOKEN, ECOMM_KEY } from "./clover-mock.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const MOCK_PORT = 4010;
const APP_PORT = 3200;
const MOCK = `http://127.0.0.1:${MOCK_PORT}`;
const APP = `http://127.0.0.1:${APP_PORT}`;

const ENV = {
  ...process.env,
  CLOVER_ENV: "sandbox",
  CLOVER_MERCHANT_ID: MID,
  CLOVER_API_TOKEN: REST_TOKEN,
  CLOVER_ECOMM_PRIVATE_KEY: ECOMM_KEY,
  CLOVER_REST_BASE: MOCK,
  CLOVER_ECOMM_BASE: MOCK,
  CLOVER_ONLINE_CATEGORY: "Website",
  NEXT_PUBLIC_CLOVER_PUBLIC_KEY: "test-public-key",
  NEXT_PUBLIC_CLOVER_MERCHANT_ID: MID,
  NEXT_PUBLIC_CLOVER_ENV: "sandbox",
  NEXT_PUBLIC_CLOVER_SDK_URL: `${MOCK}/sdk.js`,
  NEXT_DIST_DIR: ".next-clover",
  // A running deal on the beanie: $24.99 → $19.99.
  NEXT_PUBLIC_DEALS: JSON.stringify([{ product: "hatwear-navy-cuffed-beanie", salePrice: 19.99, endsAt: "2099-01-01T00:00:00Z" }]),
  NO_PROXY: "127.0.0.1,localhost",
  no_proxy: "127.0.0.1,localhost",
};

let passed = 0;
const failures = [];
async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`  ✗ ${name}\n      ${String(e.message ?? e).split("\n")[0]}`);
  }
}
const expect = (c, m) => {
  if (!c) throw new Error(m);
};
const post = (p, body) => fetch(APP + p, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7" }, body: JSON.stringify(body) });
const uuid = () => crypto.randomUUID();
/** Like spawnSync, but keeps this process's event loop (and the mock server) running. */
function run(cmd, args, env) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd: ROOT, env });
    let stdout = "", stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}
const LINE = { productId: "cl-GRP_GIANTS", colorId: "black", size: "7 3/8", qty: 1 };
const CUSTOMER = { name: "Test Customer", email: "test@example.com", phone: "(209) 555-0147" };

const { server: mock, state } = await startMock(MOCK_PORT);
let app;
try {
  console.log("Sync + build with Clover enabled");
  const sync = await run("node", ["scripts/sync-clover.mjs"], ENV);
  await check("catalog sync pulls only website-category, visible items", async () => {
    expect(sync.status === 0, sync.stderr || sync.stdout);
    const raw = JSON.parse(readFileSync(path.join(ROOT, "src/data/clover-raw.generated.json"), "utf8"));
    const ids = raw.items.map((i) => i.id).sort();
    expect(JSON.stringify(ids) === JSON.stringify(["IT_B712", "IT_B714", "IT_B738", "IT_BEANIE", "IT_EMB", "IT_N738"]), `got ${ids}`);
  });
  const build = await run("npx", ["next", "build"], ENV);
  if (build.status !== 0) throw new Error(`build failed:\n${build.stdout.slice(-2000)}\n${build.stderr.slice(-2000)}`);
  app = spawn("npx", ["next", "start", "-p", String(APP_PORT)], { cwd: ROOT, env: ENV, stdio: "ignore" });
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(APP)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("Catalog");
  await check("shop lists Clover products and drops services, hidden and store-only items", async () => {
    // The shop grid renders in the browser (it reads filters from the URL), so check it there.
    const b = await chromium.launch();
    const p = await b.newPage();
    await p.goto(`${APP}/shop`, { waitUntil: "networkidle" });
    await p.waitForSelector("#results article h3");
    const names = await p.locator("#results article h3").allTextContents();
    const html = await p.content();
    await b.close();
    expect(names.includes("San Francisco Giants 59FIFTY Fitted") && names.includes("HatWear Navy Cuffed Beanie"), `names: ${names}`);
    expect(!names.some((n) => /Embroidery|Old Snapback|Store-only/.test(n)), `unexpected: ${names}`);
    expect(names.length === 2, `expected 2 products, got ${names.length}`);
    expect(!html.includes("Preview catalog"), "preview banner still shown");
  });

  await check("product page shows Clover sizes, colours and a sold-out size", async () => {
    const b = await chromium.launch();
    const p = await b.newPage();
    await p.goto(`${APP}/product/san-francisco-giants-59fifty-fitted`, { waitUntil: "networkidle" });
    const sizes = await p.locator('#buy input[type="radio"][value^="7"]').evaluateAll((els) => els.map((e) => `${e.value}${e.disabled ? "(out)" : ""}`));
    const colours = await p.locator('#buy fieldset').first().locator("input").count();
    const price = await p.locator("p.font-display").first().textContent();
    await b.close();
    expect(JSON.stringify(sizes) === JSON.stringify(["7 1/4", "7 3/8", "7 1/2(out)"]), `sizes ${sizes}`);
    expect(colours === 2, `colours ${colours}`);
    expect(price.includes("46.99"), `price ${price}`);
  });

  console.log("Checkout API");
  await check("quote returns Clover's live price, tax and total", async () => {
    const r = await post("/api/checkout/quote", { lines: [LINE] });
    const d = await r.json();
    expect(r.ok && d.subtotal === 4699 && d.tax === 423 && d.total === 5122, JSON.stringify(d));
  });
  await check("quote refuses more than Clover has in stock", async () => {
    const r = await post("/api/checkout/quote", { lines: [{ ...LINE, qty: 2 }] });
    const d = await r.json();
    expect(r.status === 409 && /Only 1 left/.test(d.message), `${r.status} ${d.message}`);
  });
  await check("sample products can't be bought", async () => {
    const r = await post("/api/checkout/quote", { lines: [{ productId: "hw-001", colorId: "x", size: "7", qty: 1 }] });
    expect(r.status === 409, `status ${r.status}`);
  });
  let firstOrder;
  const key = uuid();
  await check("pay creates a Clover order, charges it and records the customer", async () => {
    const r = await post("/api/checkout/pay", { lines: [LINE], customer: CUSTOMER, token: "clv_test_ok_1111", idempotencyKey: key });
    const d = await r.json();
    expect(r.ok, JSON.stringify(d));
    firstOrder = d.orderId;
    const o = state.orders.get(d.orderId);
    expect(o?.status === "paid" && d.amountPaid === 5122 && d.last4 === "1111", JSON.stringify({ d, o }));
    expect(o.cart.note.includes("Test Customer") && o.cart.note.includes("(209) 555-0147") && /pickup/i.test(o.cart.note), o.cart.note);
    expect(o.cart.lineItems.length === 1 && o.cart.lineItems[0].item.id === "IT_B738", JSON.stringify(o.cart.lineItems));
    const payCall = state.pays.at(-1);
    expect(payCall.key === key && payCall.body.email === CUSTOMER.email && payCall.ip === "203.0.113.7", JSON.stringify(payCall));
  });
  await check("retrying with the same key never charges twice", async () => {
    const before = state.pays.length;
    const ordersBefore = state.nextOrder;
    const r = await post("/api/checkout/pay", { lines: [LINE], customer: CUSTOMER, token: "clv_test_ok_1111", idempotencyKey: key });
    const d = await r.json();
    expect(r.ok && d.orderId === firstOrder, JSON.stringify(d));
    expect(state.pays.length === before && state.nextOrder === ordersBefore, "a second order or payment was created");
  });
  await check("a declined card shows a clear message and cancels the order", async () => {
    const r = await post("/api/checkout/pay", { lines: [LINE], customer: CUSTOMER, token: "clv_decline_test", idempotencyKey: uuid() });
    const d = await r.json();
    expect(r.status === 402 && /declined/i.test(d.message), `${r.status} ${d.message}`);
    const lastPay = state.pays.at(-1);
    expect(state.deleted.includes(lastPay.orderId), "declined order was not deleted");
  });
  await check("a deal is charged as a Clover line discount", async () => {
    const q = await (await post("/api/checkout/quote", { lines: [{ productId: "cl-item-IT_BEANIE", colorId: "one-colour", size: "One size", qty: 1 }] })).json();
    expect(q.subtotal === 1999 && q.tax === 180 && q.total === 2179, JSON.stringify(q));
    const r = await post("/api/checkout/pay", {
      lines: [{ productId: "cl-item-IT_BEANIE", colorId: "one-colour", size: "One size", qty: 1 }],
      customer: CUSTOMER,
      token: "clv_test_ok_1111",
      idempotencyKey: uuid(),
    });
    const d = await r.json();
    expect(r.ok && d.amountPaid === 2179, JSON.stringify(d));
    const li = state.orders.get(d.orderId).cart.lineItems[0];
    expect(li.discounts?.[0]?.amount === -500, JSON.stringify(li));
  });

  await check("bad customer details are rejected before anything is charged", async () => {
    const before = state.pays.length;
    const r = await post("/api/checkout/pay", { lines: [LINE], customer: { name: "", email: "nope", phone: "12" }, token: "clv_test_ok_1111", idempotencyKey: uuid() });
    const d = await r.json();
    expect(r.status === 422 && d.errors?.email && d.errors?.phone && d.errors?.name, JSON.stringify(d));
    expect(state.pays.length === before, "a payment was attempted");
  });

  console.log("Browser checkout");
  await check("customer can pay by card and sees the confirmation", async () => {
    const b = await chromium.launch();
    const p = await b.newPage();
    await p.goto(`${APP}/product/san-francisco-giants-59fifty-fitted`, { waitUntil: "networkidle" });
    await p.locator('#buy input[value="7 1/4"]').check({ force: true });
    await p.locator('#buy button:has-text("Add to bag")').click();
    await p.waitForSelector('[role="dialog"][aria-labelledby="cart-title"]');
    await p.click('aside a:has-text("Checkout")');
    await p.waitForURL(/\/checkout/);
    await p.waitForSelector('[data-clover-field="CARD_NUMBER"]');
    await p.waitForSelector('button:has-text("Pay $51.22")');
    await p.fill("#co-name", CUSTOMER.name);
    await p.fill("#co-phone", CUSTOMER.phone);
    await p.fill("#co-email", CUSTOMER.email);
    await p.fill('[data-clover-field="CARD_NUMBER"]', "4111 1111 1111 1111");
    await p.click('button:has-text("Pay $51.22")');
    await p.waitForSelector("text=You're all set");
    const body = await p.textContent("body");
    expect(/Paid \$51\.22/.test(body) && /•••• 1111/.test(body), "confirmation details missing");
    await p.screenshot({ path: path.join(ROOT, "tests/screens/clover-confirmation.png") }).catch(() => {});
    const cart = await p.getAttribute('header button[aria-label^="Cart"]', "aria-label");
    await b.close();
    expect(cart.includes("0 items"), `cart not cleared: ${cart}`);
  });
  await check("a declined card keeps the customer on checkout with a message", async () => {
    const b = await chromium.launch();
    const p = await b.newPage();
    await p.goto(`${APP}/product/hatwear-navy-cuffed-beanie`, { waitUntil: "networkidle" });
    await p.locator('#buy button:has-text("Add to bag")').click();
    await p.goto(`${APP}/checkout`, { waitUntil: "networkidle" });
    await p.waitForSelector('[data-clover-field="CARD_NUMBER"]');
    await p.waitForSelector('button:has-text("Pay $21.79")');
    await p.fill("#co-name", CUSTOMER.name);
    await p.fill("#co-phone", CUSTOMER.phone);
    await p.fill("#co-email", CUSTOMER.email);
    await p.fill('[data-clover-field="CARD_NUMBER"]', "4000 0000 0000 0002");
    await p.click('button:has-text("Pay $21.79")');
    await p.waitForSelector('[role="alert"]:has-text("declined")');
    await p.screenshot({ path: path.join(ROOT, "tests/screens/clover-checkout.png"), fullPage: true }).catch(() => {});
    await b.close();
  });
} catch (e) {
  failures.push("setup");
  console.log(`  ✗ setup\n      ${e.message}`);
} finally {
  app?.kill("SIGTERM");
  mock.close();
  spawnSync("node", ["scripts/sync-clover.mjs"], { cwd: ROOT, env: { PATH: process.env.PATH, HOME: process.env.HOME }, encoding: "utf8" });
}
console.log(`\n${passed} passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
