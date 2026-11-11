# HatWear storefront

The website for **HatWear**: sports hats, beanies, streetwear and custom embroidery at 5340 W Yokuts Ave, Stockton, CA. Phone (209) 688-3466. Instagram [@hatwear209](https://www.instagram.com/hatwear209/).

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 and Motion.

> **Status: working preview.** Every page and button works, but the **products, prices and stock are sample data**. Online **payment is not connected**: no order can be placed or charged. The site says so wherever it matters.

## Run it

```bash
cd projects/hatwear
npm install
npm run dev          # http://localhost:3000
```

Production:

```bash
npm run build
ADMIN_TOKEN=pick-a-long-random-string npm start
```

Copy `.env.example` to `.env.local` and fill in the values you need (all are optional for local use).

### Tests

25 end-to-end checks cover:

- navigation, search, filters, sorting and pagination
- size selection, quick view, cart maths and persistence, and wishlist
- size-guide maths, the checkout demo mode, and embroidery submission with an artwork upload
- API validation, the admin lock, and the 404 page
- the mobile menu and filter sheet, horizontal overflow, touch targets, and reduced motion

They need Playwright with Chromium (`npm i -D playwright && npx playwright install chromium`):

```bash
npm run build && ADMIN_TOKEN=test-admin-token-123 npm start   # terminal 1
npm run test:e2e                                              # terminal 2
```

## What's on the site

| Page | What it does |
|---|---|
| `/` | Hat-wall hero, shop by style, new arrivals, shop by team (MLB, NFL, NBA), embroidery spotlight, visit-the-store block with map |
| `/shop` | Catalog filtered by style, league, team, size (in stock only), colour, price, brand and availability. Also has sort, search, pagination, a mobile filter sheet and shareable URLs |
| `/product/[slug]` | Front, side, back and stitch-detail views (swipe or arrow keys). Has colourways, stock-aware sizes, quantity, add to bag, wishlist, a fitted size guide with a calculator, details, care, related items and a sticky mobile buy bar |
| `/teams` | League tabs, then team, then products |
| `/custom` | **Embroidery studio**: choose a product and colour (or bring your own item), enter text in one of 3 lettering styles or upload artwork, then pick placement, thread colour (12 options) and quantity, and add notes. A live preview switches views and is labelled as approximate. The customer reviews the details and sends a quote request, then sees a confirmation with a reference number |
| `/store` | Address, tap to call, Google and Apple directions, hours, map, photo gallery (placeholders until real photos arrive), Instagram |
| `/size-guide`, `/wishlist`, `/checkout` | Size guide, wishlist saved on the device, and order review with "text the list to the store" (demo mode) |
| `/admin/requests?token=…` | The owner's inbox of embroidery requests, including uploaded artwork. Hidden (404) unless `ADMIN_TOKEN` is set |

SEO includes:

- page titles and descriptions
- `ClothingStore` and `Product` structured data
- `sitemap.xml` and `robots.txt`
- canonical URLs

## Where to edit things (no rebuild of components needed)

| What | File |
|---|---|
| Address, phone, Instagram, **hours**, store photos | `src/content/site.ts` |
| Announcement bar messages | `src/content/site.ts` → `announcements`. Only list things that are true today |
| Embroidery pricing (shows an estimate once verified) | `src/content/site.ts` → `embroideryPricing` |
| Demo flags | `DEMO_CATALOG`, `DEMO_CHECKOUT` in `src/content/site.ts` |
| Products | `src/data/catalog.ts`, or connect a backend (below) |
| Product photos | Put files in `public/products/<slug>/` and list them in the product's `images` (per colourway: front, side, back, detail). Photos replace the illustrations automatically |
| Embroidery options (bases, threads, placements, limits) | `src/lib/embroidery.ts` |
| Brand colours, type, buttons | `src/app/globals.css` (`@theme` tokens) |

## Connect Clover (products, stock and payments)

The site is built to run on HatWear's Clover account:

- **Products:** products, sizes, colours, prices and stock are read from Clover inventory at every build.
- **Payments:** online payments are charged through Clover, using Clover's secure card form plus Google Pay.
- **Orders:** each sale is created as a Clover order, with the customer's name and phone in the order note, for **in-store pickup**.

Until the values below are set, the site stays in preview mode: sample products and no payments.

### 1. Turn on online payments in Clover
In the Clover web dashboard, open **Settings → View all settings → Ecommerce**. If you don't see Ecommerce or online payments, ask Clover or Fiserv support to enable **Clover Ecommerce (card-not-present) payments** for the account.

### 2. Create the payment keys
1. **Settings → View all settings → Ecommerce → Ecommerce API Tokens.** Clover asks you to switch on two-factor sign-in the first time.
2. Choose **Create New Token**, with integration type **Hosted iFrame + API/SDK**.
3. Copy:
   - the **public token** → `NEXT_PUBLIC_CLOVER_PUBLIC_KEY`
   - the **private token** → `CLOVER_ECOMM_PRIVATE_KEY`

   Keep the private token secret.

### 3. Create the inventory/orders key
1. In the dashboard's **API Tokens** page (under Setup or Account settings), create a token with these permissions:
   - **Inventory: Read**
   - **Orders: Read and Write**
   - **Merchant: Read**
2. Save it as `CLOVER_API_TOKEN`.

### 4. Find the merchant ID
It's on the dashboard's account or merchant settings page, and in the dashboard URL after `/m/`. Set it as both `CLOVER_MERCHANT_ID` and `NEXT_PUBLIC_CLOVER_MERCHANT_ID`.

### 5. Get the inventory ready
- **One product = one item group.** For example, "Giants 59FIFTY Fitted Black" is a group with a **Size** attribute (7, 7 1/8, …) and optionally **Color**. Each size is its own item with its own stock.
- **Category:** put the style (Fitted, Snapback, Trucker, Dad Hat, Beanie, Hoodie, Windbreaker) in the category or name.
- **Team names:** include them in the name ("Giants", "49ers", "Warriors").
- **Online category:** create a category such as **Website**, add the items you want online, and set `CLOVER_ONLINE_CATEGORY=Website`.
- **Stock and price:** turn on stock tracking and give each item a fixed price. Unpriced and hidden items never appear online.
- **Optional order type:** create an order type such as "Website pickup" and set `CLOVER_ORDER_TYPE_ID`.

### 6. Add the values to Vercel and test first
1. In Vercel, go to **Project → Settings → Environment Variables** and add the variables above (see `.env.example`).
2. **Start with a sandbox test merchant:**
   - Clover Global Developer Dashboard → test merchant → its own tokens
   - set `CLOVER_ENV=sandbox` and `NEXT_PUBLIC_CLOVER_ENV=sandbox`
   - pay with Clover test cards
3. Check that the test order appears in Clover with the right items, tax and note.
4. Check that the item's stock went down. If it didn't, set `CLOVER_DECREMENT_STOCK=1`.
5. Switch everything to the production keys, with both env settings set to `production`, and redeploy.

### 7. Keep products fresh
- **Daily refresh:** create a Deploy Hook in Vercel (**Settings → Git → Deploy Hooks**), save its URL as `VERCEL_DEPLOY_HOOK_URL`, and set a random `CRON_SECRET`. The site then rebuilds every day (`vercel.json`).
- **Refresh now:** open `/api/catalog/refresh?token=ADMIN_TOKEN`.
- **Overselling is impossible:** checkout always re-checks the live Clover price and stock before charging, so a page that's a day old can't oversell.

### What's tested
`npm run test:clover` runs 12 checks against a local stand-in for Clover's APIs (`tests/clover-mock.mjs`):

- catalog sync and filtering
- product pages built from Clover variants
- live price, stock and tax checks
- a paid order with the customer note
- no double charges on retry
- declined cards cancelling the order
- the full browser checkout

It doesn't replace one real sandbox order with HatWear's own Clover account (step 6).

## Limited-time deals

Deals are set in **`src/content/deals.ts`** (or, without touching code, as JSON in Vercel's `NEXT_PUBLIC_DEALS` environment variable, followed by a redeploy). Each deal is one line:

```ts
{ product: "san-francisco-giants-59fifty-fitted", salePrice: 35, endsAt: "2026-11-30T23:59:00-08:00" }
```

- **`product`:** the product's web address (the part after `/product/` in its URL).
- **`salePrice`:** what customers pay. It must be lower than the regular price.
- **`endsAt`:** when the deal ends. The deal switches itself off at that moment. `startsAt` and a `label` such as "Black Friday" are optional.

While a deal runs, the site shows:
- the homepage "Limited-time deals" section, with a countdown
- the `/deals` page
- a **Deals** link in the menu
- an announcement-bar message
- sale prices and badges on product cards and pages, in the bag and at checkout

**At checkout,** Clover is charged the sale price as a "Limited-time deal" discount on the order, so Clover reports show it.

**Sample deals:** the ones in `sampleDeals` only appear in preview mode (sample catalog). With the real Clover catalog, only `liveDeals` and `NEXT_PUBLIC_DEALS` count, so list only deals the store is actually running.

## Before accepting real customer orders

1. **Connect Clover**, following the steps above. Until then the site shows sample products and checkout stays in preview mode.
2. **Add real inventory to Clover's "Website" category.** Products, prices and stock then come from Clover automatically.
3. **Policies.** Shipping or local pickup, returns and exchanges, sales tax, a privacy policy and terms. The product page currently says returns terms are pending.
4. **Business details.** Hours (Mon–Fri 11–7, Sat 11–8, Sun 11–7), the Sherwood Place location, and the advertised "embroidery from $7.99" now come from the store's Google listing and Instagram. Keep `src/content/site.ts` in step if they change, and confirm which brands and leagues the store stocks.
5. **Embroidery request delivery.** Set `EMBROIDERY_WEBHOOK_URL` (Slack, Zapier, Make or an email service) so each request reaches the owner immediately. Requests are also saved under `.data/`, but on serverless hosting that folder is temporary, so use the webhook or swap `src/lib/requests-store.ts` for a database or object storage. Set `ADMIN_TOKEN` to use `/admin/requests`.
6. **Photography and licensing.**
   - Add product photos and real store photos to `site.storePhotos`.
   - Only use official MLB, NFL and NBA marks on genuine licensed merchandise and its photos.
   - Use Instagram content only with the business's permission, through Meta's API.
7. **Domain and hosting.** The live site is https://hatwear209.vercel.app (the default for `site.url`). If you buy a custom domain, set `NEXT_PUBLIC_SITE_URL` to it, deploy (Vercel or any Node host), and add analytics if wanted.

## Design system

- **Source:** the HatWear storefront sign, white letters on a navy facade, with the HW snapback between HAT and WEAR.
- **Logo:** `src/components/Brand.tsx` redraws the sign as `Wordmark` (HAT [cap] WEAR) and `CapMark` (the HW snapback, also the favicon). Swap in the official vector logo files when available.
- **Colour** (`src/app/globals.css` `@theme`):
  - Navy: Ink `#13233a` and Charcoal `#1d3557`
  - White and cool tints: Bone `#ffffff`, Chalk `#f4f7fb`, Felt `#e9eff6`
  - Sign Blue `#2557b8` for buttons, links and focus, and Sign Light `#9cc0ff` for accents on navy
- **Type:** Archivo throughout. Headings and the wordmark use its wide, heavy cut (`wdth` 118–125, weight 900) to match the sign. Yellowtail is only for the "script" embroidery option.
- **Details:** running-stitch dividers, woven-label badges, and twill texture on navy sections.
- **Imagery:** `src/components/ProductArt.tsx` draws every product as a labelled SVG illustration until real photos are added.
- **Motion:** Motion for React.
  - One hero entrance.
  - Clip-path reveals on scroll.
  - Spring sheets for the cart and menu.
  - Shared-layout indicators.
  - Crossfades for galleries and variants.
  - `MotionConfig reducedMotion="user"` respects the visitor's setting.
- **Accessibility:**
  - skip link, labelled landmarks, focus-trapped modals, and Escape to close
  - visible focus and 44px touch targets
  - AA contrast

## Audit notes

The rendered pages were checked with Impeccable's detector. Fixed:

- text under 12px
- low-contrast codes and placeholders
- heading order
- line length

One flag is kept on purpose: the **"purple palette"** comes from the Kings and Lakers team colourways, not the brand palette.

The disabled sold-out size chips are below 4.5:1, which WCAG permits for disabled controls.
