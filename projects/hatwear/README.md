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

## Before accepting real customer orders

These are the steps needed for a live store. None of them is done yet.

1. **Real catalog.** Replace the sample data with HatWear's inventory. The cleanest path is a commerce backend: the store already uses a `src/lib/catalog.ts` access layer, so connect Shopify (Storefront API), Square Online or a headless CMS there and the pages keep working. Set `DEMO_CATALOG = false`.
2. **Payments.** Connect a provider and its hosted checkout (Shopify Checkout, Stripe Checkout or Square). Replace the cart persistence in `src/lib/store.tsx` with the provider's cart API, point "Checkout" at the hosted checkout, and set `DEMO_CHECKOUT = false`. Card details should never touch this server.
3. **Policies.** Shipping or local pickup, returns and exchanges, sales tax, a privacy policy and terms. The product page currently says returns terms are pending.
4. **Verified business details.** Fill in opening hours (`hours` and `hoursSchema`), confirm the embroidery pricing (the old "from $7.99" is **not** shown because it hasn't been re-confirmed), and confirm which brands and leagues the store stocks.
5. **Embroidery request delivery.** Set `EMBROIDERY_WEBHOOK_URL` (Slack, Zapier, Make or an email service) so each request reaches the owner immediately. Requests are also saved under `.data/`, but on serverless hosting that folder is temporary, so use the webhook or swap `src/lib/requests-store.ts` for a database or object storage. Set `ADMIN_TOKEN` to use `/admin/requests`.
6. **Photography and licensing.**
   - Add product photos and real store photos to `site.storePhotos`.
   - Only use official MLB, NFL and NBA marks on genuine licensed merchandise and its photos.
   - Use Instagram content only with the business's permission, through Meta's API.
7. **Domain and hosting.** Set `NEXT_PUBLIC_SITE_URL`, deploy (Vercel or any Node host), and add analytics if wanted.

## Design system

- **Concept:** "The Wall". A hat store's identity is its wall of crowns. The hero racks hats onto shelves, and everything else stays quiet.
- **Colour:**
  - Crown Black `#1a1918` and Charcoal `#2b2a28`
  - Bone `#efebe4` and Felt `#e2dcd2`
  - Stitch Red `#d2261c`, used only for actions, thread and the crown button
- **Type:** Big Shoulders (condensed athletic display, wordmark) and Archivo (UI and body). Yellowtail is only for the "script" embroidery option.
- **Signature details:** running-stitch dividers, woven-label badges, twill texture, and the six-panel crown mark with a red button.
- **Imagery:** `src/components/ProductArt.tsx` draws every product as an SVG illustration, with views, satin-stitch embroidery and mesh or knit textures. Every image is labelled as an illustration, so nothing is passed off as a photo of real stock.
- **Motion:** Motion for React.
  - One orchestrated hero entrance.
  - Clip-path image reveals on scroll.
  - Spring cart and menu sheets.
  - Shared-layout indicators for nav, tabs and size selection.
  - Crossfades for galleries and variants.
  - `MotionConfig reducedMotion="user"` respects the visitor's reduced-motion setting everywhere.
- **Accessibility:**
  - skip link, labelled landmarks, focus-trapped modals, and Escape to close
  - visible focus and 44px touch targets
  - AA contrast checked with the Impeccable detector (see below)

## Audit notes

The rendered pages were checked with Impeccable's detector. Fixed:

- text under 12px
- low-contrast codes and placeholders
- heading order
- line length

Two flags are kept on purpose:

- **"Cream background":** the off-white Bone surface was specified in the brief.
- **"Purple palette":** the purple comes from the Kings and Lakers team colourways, not the brand palette.

The disabled sold-out size chips are below 4.5:1, which WCAG permits for disabled controls.
