# Classic Snapback photos

Put each photo at `public/assets/hats/<mlb|nfl>/<team-slug>/<view>.webp` where `<view>` is `front`, `back`, `inside` or `side` (`.jpg`/`.png` also work). Team slugs are in `src/data/classic-snapbacks.json`.

- **front:** three-quarter front, logo and brim visible
- **back:** straight from behind, snap closure centred, brim hidden
- **inside:** inside of the crown and underside of the brim
- **side:** side profile

All four must show the same exact hat. Square, 1000–1600 px, clean white background. Only use photos you took yourself or have written permission to publish.

Run `npm run photos:status` to see what is still missing, then redeploy.
