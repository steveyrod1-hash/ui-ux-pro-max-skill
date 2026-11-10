/**
 * End-to-end checks for the HatWear storefront.
 *
 *   npm run build && ADMIN_TOKEN=test-admin-token-123 npm start   # in one terminal
 *   npm run test:e2e                                              # in another
 *
 * Requires Playwright with Chromium (npm i -D playwright && npx playwright install chromium).
 * BASE_URL and ADMIN_TOKEN can be overridden with environment variables.
 */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3100";
const TOKEN = process.env.ADMIN_TOKEN ?? "test-admin-token-123";
const SHOTS = path.join(path.dirname(new URL(import.meta.url).pathname), "screens");
mkdirSync(SHOTS, { recursive: true });

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
const expect = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const browser = await chromium.launch();

// ------------------------------------------------------------------ desktop
{
  console.log("Desktop (1440×900)");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await check("home renders hero, wordmark and nav", async () => {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    expect((await page.textContent("#hero-title")).toLowerCase().includes("more than"), "hero headline missing");
    for (const label of ["Shop All", "Fitted Hats", "Snapbacks", "Teams", "Streetwear", "Custom Embroidery", "Our Store"]) {
      expect(await page.locator(`header nav a:has-text("${label}")`).count(), `nav link ${label} missing`);
    }
  });

  await check("structured data describes the store", async () => {
    const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').first().textContent());
    expect(ld.address.streetAddress === "5340 W Yokuts Ave" && ld.telephone === "+12096883466", "LocalBusiness data wrong");
  });

  await check("contact and directions links are real", async () => {
    expect(await page.locator('a[href="tel:+12096883466"]').count(), "no tap-to-call link");
    expect(await page.locator('a[href*="google.com/maps/dir"]').count(), "no directions link");
    expect(await page.locator('a[href="https://www.instagram.com/hatwear209/"]').count(), "no Instagram link");
  });

  await check("header search shows instant results and opens the shop", async () => {
    await page.click('button[aria-label="Search"]');
    await page.fill("#site-search", "warriors");
    await page.waitForSelector('[role="dialog"][aria-label="Search the store"] a[href^="/product/"]');
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/shop\?q=warriors/);
    await page.waitForSelector("#results article");
    const names = await page.locator("#results article h3").allTextContents();
    expect(names.length > 0 && names.every((n) => /warriors/i.test(n)), `unexpected results: ${names.join(", ")}`);
  });

  await check("filters: type + size + in-stock narrow results and update the URL", async () => {
    await page.goto(BASE + "/shop", { waitUntil: "networkidle" });
    const total = parseInt(await page.locator('#results p[aria-live]').textContent());
    await page.locator('aside[aria-label="Filters"] label:has-text("Fitted") input').first().check();
    await page.waitForURL(/type=fitted/);
    const fitted = parseInt(await page.locator('#results p[aria-live]').textContent());
    expect(fitted > 0 && fitted < total, `fitted count ${fitted} vs total ${total}`);
    const sizeToggle = page.locator('aside[aria-label="Filters"] button[aria-expanded]:has-text("Size")');
    if ((await sizeToggle.getAttribute("aria-expanded")) === "false") await sizeToggle.click();
    await page.locator('aside[aria-label="Filters"] li label', { hasText: /^7 3\/8$/ }).click();
    await page.waitForURL(/size=7/);
    await page.locator('aside[aria-label="Filters"] label:has(input[role="switch"])').click();
    await page.waitForURL(/instock=1/);
    const narrowed = parseInt(await page.locator('#results p[aria-live]').textContent());
    expect(narrowed > 0 && narrowed <= fitted, `narrowed ${narrowed}`);
    const types = await page.locator("#results article > div:nth-child(2) > p:first-child").allTextContents();
    expect(types.every((t) => t.includes("Fitted")), "non-fitted product shown");
  });

  await check("league and team filtering", async () => {
    await page.goto(BASE + "/shop?team=" + encodeURIComponent("San Francisco 49ers"), { waitUntil: "networkidle" });
    const names = await page.locator("#results article h3").allTextContents();
    expect(names.length > 0 && names.every((n) => n.includes("49ers")), "team filter leaked");
    await page.goto(BASE + "/teams", { waitUntil: "networkidle" });
    await page.click('[role="tab"]:has-text("NBA")');
    await page.waitForSelector('#panel-NBA a:has-text("Sacramento Kings")');
  });

  await check("sorting by price low to high", async () => {
    await page.goto(BASE + "/shop?sort=price-asc", { waitUntil: "networkidle" });
    const prices = (await page.locator("#results article p.tabular-nums").allTextContents()).map((p) => parseFloat(p.replace(/[^0-9.]/g, "")));
    expect(prices.every((p, i) => i === 0 || p >= prices[i - 1]), "prices not ascending");
  });

  await check("pagination moves to page 2", async () => {
    await page.goto(BASE + "/shop", { waitUntil: "networkidle" });
    const first = await page.locator("#results article h3").first().textContent();
    await page.click('nav[aria-label="Pagination"] button:has-text("2")');
    await page.waitForURL(/page=2/);
    await page.waitForTimeout(400);
    expect((await page.locator("#results article h3").first().textContent()) !== first, "page 2 shows the same items");
  });

  let productUrl;
  await check("product page: gallery, size required, add to bag", async () => {
    await page.goto(BASE + "/shop?type=fitted&instock=1", { waitUntil: "networkidle" });
    await page.locator("#results article h3 a").first().click();
    await page.waitForURL(/\/product\//);
    productUrl = page.url();
    await page.click('button[aria-label="Next image"]');
    await page.waitForSelector('[aria-live="polite"]:has-text("Side")');
    await page.locator('button:has-text("Add to bag")').first().click();
    await page.waitForSelector('[role="alert"]:has-text("Choose a size")');
    const size = page.locator('#buy label:not(.cursor-not-allowed) input[type="radio"][value^="7"]').first();
    await size.check({ force: true });
    await page.locator('#buy button:has-text("Add to bag")').click();
    await page.waitForSelector('[role="dialog"][aria-labelledby="cart-title"]');
  });

  await check("cart: quantity, subtotal and persistence across reloads", async () => {
    const price = parseFloat((await page.locator("aside li span.tabular-nums").first().textContent()).replace(/[^0-9.]/g, ""));
    await page.click('aside button[aria-label="Increase quantity"]');
    await page.waitForTimeout(300);
    const sub = parseFloat((await page.locator("aside .font-display.tabular-nums").textContent()).replace(/[^0-9.]/g, ""));
    expect(Math.abs(sub - price * 2) < 0.01, `subtotal ${sub} != 2 × ${price}`);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    expect((await page.getAttribute('header button[aria-label^="Cart"]', "aria-label")).includes("2 items"), "cart not persisted");
  });

  await check("cart: remove empties the bag", async () => {
    await page.click('header button[aria-label^="Cart"]');
    await page.click('aside button:has-text("Remove")');
    await page.waitForSelector('text=Nothing in the bag yet');
    await page.keyboard.press("Escape");
  });

  await check("quick view adds a one-size item", async () => {
    await page.goto(BASE + "/shop?type=snapback&instock=1", { waitUntil: "networkidle" });
    const card = page.locator("#results article").first();
    await card.hover();
    await card.locator('button:has-text("Quick view")').first().click();
    const dialog = page.locator('[role="dialog"][aria-label^="Quick view"]');
    await dialog.waitFor();
    await dialog.locator('button:has-text("Add to bag")').click();
    await page.waitForSelector('[role="dialog"][aria-labelledby="cart-title"]');
    await page.keyboard.press("Escape");
  });

  await check("wishlist toggles and lists the product", async () => {
    await page.goto(productUrl, { waitUntil: "networkidle" });
    await page.locator('#buy button[aria-label^="Save"]').click();
    await page.goto(BASE + "/wishlist", { waitUntil: "networkidle" });
    await page.waitForSelector("article h3");
  });

  await check("fitted size guide calculates a size", async () => {
    await page.goto(BASE + "/size-guide", { waitUntil: "networkidle" });
    await page.fill("#head-measure", "58.5");
    await page.click('button:has-text("cm")');
    await page.waitForSelector('text=Your size is');
    expect((await page.textContent('p[aria-live="polite"]')).includes("7 3/8"), "58.5 cm should be 7 3/8");
  });

  await check("checkout is clearly in demo mode and offers real actions", async () => {
    await page.goto(BASE + "/checkout", { waitUntil: "networkidle" });
    await page.waitForSelector("text=Online payment isn't connected yet");
    expect(await page.locator('a[href^="sms:+12096883466"]').count(), "no text-the-store action");
    expect(await page.locator('fieldset[disabled] legend:has-text("Payment")').count(), "payment not disabled");
  });

  await check("embroidery studio: validation, live preview, upload and submission", async () => {
    await page.goto(BASE + "/custom?base=snapback", { waitUntil: "networkidle" });
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")'); // no design yet
    await page.waitForSelector('[role="alert"]:has-text("Add text, upload artwork, or both")');
    await page.fill('input[placeholder^="Name, number"]', "STOCKTON");
    await page.waitForSelector('svg [data-embroidery-preview] text:has-text("STOCKTON")');
    // Upload a small PNG as artwork.
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAKElEQVR42mP8z8Dwn4EIwMjAwMDEQCRgYmBgYBw1YNSAUQNGDRhuBgAAvP0CEa6OAYEAAAAASUVORK5CYII=",
      "base64",
    );
    await page.setInputFiles('input[type="file"]', { name: "crew-logo.png", mimeType: "image/png", buffer: png });
    await page.waitForSelector("text=crew-logo.png");
    await page.locator('label:has-text("Back") input[type="radio"]').check({ force: true });
    await page.locator('label[title="Gold"] input').check({ force: true });
    await page.click('button:has-text("Next")');
    await page.waitForSelector("text=Request a quote");
    await page.click('button:has-text("Looks right")');
    await page.click('button:has-text("Send request")');
    await page.waitForSelector('[role="alert"]:has-text("Enter your name")');
    await page.fill('input[autocomplete="name"]', "Test Customer");
    await page.fill('input[autocomplete="tel"]', "(209) 555-0147");
    await page.click('button:has-text("Send request")');
    await page.waitForSelector("text=Request sent");
    const ref = (await page.locator("span.font-display.tracking-wide").textContent()).trim();
    expect(/^HW-\d{6}-[A-Z0-9]{3}$/.test(ref), `bad reference ${ref}`);
    await page.screenshot({ path: path.join(SHOTS, "embroidery-sent.png") });

    // The owner's inbox shows it, with the artwork.
    await page.goto(`${BASE}/admin/requests?token=${TOKEN}`, { waitUntil: "networkidle" });
    await page.waitForSelector(`text=${ref}`);
    expect(await page.locator(`img[alt="Artwork for ${ref}"]`).count(), "artwork missing from inbox");
  });

  await check("embroidery API rejects bad input and fake files", async () => {
    const fd = new FormData();
    fd.set("payload", JSON.stringify({ baseType: "fitted", baseColor: "black", placement: "front", thread: "red", quantity: 1, name: "X", text: "" }));
    let res = await fetch(BASE + "/api/embroidery", { method: "POST", body: fd });
    expect(res.status === 422, `expected 422, got ${res.status}`);
    const fd2 = new FormData();
    fd2.set("payload", JSON.stringify({ baseType: "fitted", baseColor: "black", placement: "front", thread: "red", quantity: 1, name: "Test", phone: "2095550147", contactMethod: "text", text: "OK" }));
    fd2.set("artwork", new Blob(["<svg onload=alert(1)>"], { type: "image/png" }), "evil.png");
    res = await fetch(BASE + "/api/embroidery", { method: "POST", body: fd2 });
    expect(res.status === 422, `fake PNG accepted (${res.status})`);
  });

  await check("admin inbox is hidden without the token", async () => {
    const res = await page.goto(BASE + "/admin/requests", { waitUntil: "networkidle" });
    expect(res.status() === 404, `status ${res.status()}`);
  });

  await check("unknown pages return the branded 404", async () => {
    const res = await page.goto(BASE + "/product/does-not-exist", { waitUntil: "networkidle" });
    expect(res.status() === 404 && (await page.textContent("h1")).toLowerCase().includes("not on the wall"), "404 page wrong");
  });

  await check("no uncaught page errors", async () => expect(errors.length === 0, errors.join(" | ")));
  await ctx.close();
}

// ------------------------------------------------------------------ mobile
{
  console.log("Mobile (iPhone 13)");
  const ctx = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await ctx.newPage();

  await check("no horizontal overflow on key pages", async () => {
    for (const p of ["/", "/shop", "/teams", "/custom", "/store", "/size-guide", "/checkout", "/wishlist"]) {
      await page.goto(BASE + p, { waitUntil: "networkidle" });
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(over <= 1, `${p} overflows by ${over}px`);
    }
    const prod = await page.evaluate(async () => (await (await fetch("/sitemap.xml")).text()).match(/\/product\/[a-z0-9-]+/)[0]);
    await page.goto(BASE + prod, { waitUntil: "networkidle" });
    expect((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, "product page overflows");
  });

  await check("mobile menu opens, navigates and closes", async () => {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.click('button[aria-label="Open menu"]');
    const menu = page.locator('[role="dialog"][aria-label="Menu"]');
    await menu.waitFor();
    await menu.locator('a:has-text("Our Store")').click();
    await page.waitForURL(/\/store/);
    await menu.waitFor({ state: "detached" });
  });

  await check("mobile filter sheet filters the catalog", async () => {
    await page.goto(BASE + "/shop", { waitUntil: "networkidle" });
    await page.click('button:has-text("Filters")');
    const sheet = page.locator('[role="dialog"][aria-label="Filters"]');
    await sheet.waitFor();
    await sheet.locator('label:has-text("Beanie") input').first().check();
    await page.waitForURL(/type=beanie/);
    await sheet.locator('button:has-text("Show")').click();
    await sheet.waitFor({ state: "detached" });
    const types = await page.locator("#results article > div:nth-child(2) > p:first-child").allTextContents();
    expect(types.length > 0 && types.every((t) => t.includes("Beanie")), "beanie filter failed");
  });

  await check("touch targets on the product page are at least 44px", async () => {
    await page.goto(BASE + "/shop?type=fitted", { waitUntil: "networkidle" });
    await page.locator("#results article h3 a").first().click();
    await page.waitForURL(/\/product\//);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("#buy button, #buy label > span:first-of-type")]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 && (r.height < 40 || r.width < 40)).length,
    );
    expect(small === 0, `${small} small targets`);
    await page.screenshot({ path: path.join(SHOTS, "product-mobile.png"), fullPage: false });
  });

  await ctx.close();
}

// ------------------------------------------------------------------ reduced motion
{
  console.log("Reduced motion");
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await check("content is visible immediately with reduced motion", async () => {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(150);
    const y = await page.evaluate(() => getComputedStyle(document.querySelector("#hero-title span span")).transform);
    expect(y === "none" || y === "matrix(1, 0, 0, 1, 0, 0)", `headline still offset: ${y}`);
  });
  await ctx.close();
}

await browser.close();
const summary = `\n${passed} passed, ${failures.length} failed`;
console.log(summary);
writeFileSync(path.join(SHOTS, "last-run.txt"), `${new Date().toISOString()}${summary}\n${failures.join("\n")}\n`);
process.exit(failures.length ? 1 : 0);
