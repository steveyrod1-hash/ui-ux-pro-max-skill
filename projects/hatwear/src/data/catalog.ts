/**
 * SAMPLE CATALOG. None of these products, prices or stock levels describe
 * HatWear's real inventory. They exist so the storefront can be built and
 * tested end to end. Replace this module (or point `src/lib/catalog.ts` at a
 * commerce backend) before launch. Team names are used only as filter data;
 * no league or club logos are reproduced anywhere in the site.
 */
import type { ColorFamily, Colorway, League, Product, ProductType } from "./types";
import { DEFAULT_STYLE } from "./styles";

export const FITTED_SIZES = ["6 7/8", "7", "7 1/8", "7 1/4", "7 3/8", "7 1/2", "7 5/8", "7 3/4", "7 7/8", "8"];
export const APPAREL_SIZES = ["S", "M", "L", "XL", "2XL"];
export const ONE_SIZE = "One size";

// Deterministic PRNG so the sample catalog is identical on server and client.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(209);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, "and").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function cw(
  name: string,
  family: ColorFamily,
  crown: string,
  visor: string,
  mark: string,
  extra: Partial<Colorway["art"]> = {},
): Colorway {
  return {
    id: slugify(name),
    name,
    family,
    swatch: crown,
    art: { crown, visor, under: extra.under ?? "#3b4a3a", button: extra.button ?? crown, mark, trim: extra.trim, ...extra },
  };
}

export interface Team {
  name: string;
  league: League;
  code: string;
  primary: [string, ColorFamily];
  secondary: string;
}

export const TEAMS: Team[] = [
  { name: "San Francisco Giants", league: "MLB", code: "SF", primary: ["#1c1b1a", "Black"], secondary: "#e8622c" },
  { name: "Athletics", league: "MLB", code: "ATH", primary: ["#123a2f", "Green"], secondary: "#e9b631" },
  { name: "Los Angeles Dodgers", league: "MLB", code: "LA", primary: ["#1f4f8f", "Royal"], secondary: "#f4f1ea" },
  { name: "New York Yankees", league: "MLB", code: "NY", primary: ["#14223b", "Navy"], secondary: "#f4f1ea" },
  { name: "San Diego Padres", league: "MLB", code: "SD", primary: ["#3a2b20", "Brown"], secondary: "#f2c037" },
  { name: "Chicago White Sox", league: "MLB", code: "CWS", primary: ["#1c1b1a", "Black"], secondary: "#c9cdd1" },
  { name: "San Francisco 49ers", league: "NFL", code: "SF", primary: ["#9e1b16", "Red"], secondary: "#c6a96a" },
  { name: "Las Vegas Raiders", league: "NFL", code: "LV", primary: ["#1c1b1a", "Black"], secondary: "#b5bbbf" },
  { name: "Dallas Cowboys", league: "NFL", code: "DAL", primary: ["#14223b", "Navy"], secondary: "#c9cdd1" },
  { name: "Los Angeles Rams", league: "NFL", code: "LA", primary: ["#1f3f8a", "Royal"], secondary: "#f3cc2f" },
  { name: "Kansas City Chiefs", league: "NFL", code: "KC", primary: ["#c4232f", "Red"], secondary: "#f3c13a" },
  { name: "Golden State Warriors", league: "NBA", code: "GSW", primary: ["#24468a", "Royal"], secondary: "#f6c445" },
  { name: "Sacramento Kings", league: "NBA", code: "SAC", primary: ["#4b2a72", "Purple"], secondary: "#b9c0c4" },
  { name: "Los Angeles Lakers", league: "NBA", code: "LAL", primary: ["#4d2775", "Purple"], secondary: "#f2b632" },
  { name: "Chicago Bulls", league: "NBA", code: "CHI", primary: ["#b51f35", "Red"], secondary: "#1c1b1a" },
  { name: "Boston Celtics", league: "NBA", code: "BOS", primary: ["#17633a", "Green"], secondary: "#f4f1ea" },
];

const TYPE_LABEL: Record<ProductType, string> = {
  fitted: "Fitted",
  snapback: "Snapback",
  trucker: "Trucker",
  adjustable: "Adjustable Cap",
  beanie: "Cuffed Beanie",
  bucket: "Bucket Hat",
  hoodie: "Hoodie",
  windbreaker: "Windbreaker",
};

const BASE_PRICE: Record<ProductType, number> = {
  fitted: 46,
  snapback: 38,
  trucker: 32,
  adjustable: 30,
  beanie: 28,
  bucket: 34,
  hoodie: 68,
  windbreaker: 76,
};

export const DETAILS: Record<ProductType, string[]> = {
  fitted: ["Structured high crown, six panels", "Flat visor with tonal underbrim", "Closed back, sized fit", "Raised front embroidery"],
  snapback: ["Structured high crown, six panels", "Flat visor", "Adjustable snap closure", "Raised front embroidery"],
  trucker: ["Foam-backed front panels", "Breathable mesh back", "Pre-curved visor", "Adjustable snap closure"],
  adjustable: ["Unstructured low crown", "Pre-curved visor", "Adjustable strap with metal buckle", "Washed cotton twill"],
  beanie: ["Rib knit body", "Fold-over cuff", "Embroidered cuff mark"],
  bucket: ["Cotton twill crown", "Stitched downturned brim", "Breathable eyelets", "Embroidered front mark"],
  hoodie: ["Midweight brushed fleece", "Lined hood with drawcord", "Kangaroo pocket", "Ribbed cuffs and hem"],
  windbreaker: ["Lightweight woven shell", "Full zip with chin guard", "Elastic cuffs", "Packable"],
};

export const CARE: Record<ProductType, string[]> = {
  fitted: ["Spot clean with a damp cloth", "Do not machine wash or tumble dry", "Store on a crown form to keep its shape"],
  snapback: ["Spot clean with a damp cloth", "Do not machine wash or tumble dry", "Keep out of hot cars to protect the visor"],
  trucker: ["Spot clean the front, rinse mesh gently", "Air dry only"],
  adjustable: ["Hand wash cold", "Reshape and air dry"],
  beanie: ["Hand wash cold", "Lay flat to dry"],
  bucket: ["Hand wash cold", "Reshape the brim and air dry"],
  hoodie: ["Machine wash cold, inside out", "Tumble dry low", "Do not iron embroidery"],
  windbreaker: ["Machine wash cold, gentle", "Hang to dry"],
};

function sizesFor(type: ProductType): string[] {
  if (type === "fitted") {
    // Each fitted style carries a contiguous run of sizes, like a real wall.
    const start = Math.floor(rand() * 2);
    const end = FITTED_SIZES.length - Math.floor(rand() * 2);
    return FITTED_SIZES.slice(start, end);
  }
  if (type === "hoodie" || type === "windbreaker") return APPAREL_SIZES.slice(0, 4 + Math.floor(rand() * 2));
  if (type === "bucket") return ["S/M", "L/XL"];
  return [ONE_SIZE];
}

function stockFor(colorways: Colorway[], sizes: string[]) {
  const stock: Product["stock"] = {};
  for (const c of colorways) {
    stock[c.id] = {};
    for (const s of sizes) {
      const r = rand();
      stock[c.id][s] = r < 0.12 ? 0 : r < 0.3 ? 1 + Math.floor(rand() * 2) : 3 + Math.floor(rand() * 9);
    }
  }
  return stock;
}

const products: Product[] = [];
let arrival = 0;

function add(p: Omit<Product, "id" | "slug" | "sizes" | "stock" | "details" | "care" | "arrival"> & { sizes?: string[] }) {
  const sizes = p.sizes ?? sizesFor(p.type);
  const style = p.style ?? DEFAULT_STYLE[p.type];
  const slug = slugify(p.name) + (products.some((x) => x.slug === slugify(p.name)) ? `-${products.length}` : "");
  products.push({
    ...p,
    style,
    id: `hw-${String(products.length + 1).padStart(3, "0")}`,
    slug,
    sizes,
    stock: stockFor(p.colorways, sizes),
    details: DETAILS[p.type],
    care: CARE[p.type],
    arrival: arrival++,
  });
}

const BONE = "#efebe4";
const SECONDARY_NAME: Record<string, string> = {
  "#e8622c": "Orange", "#e9b631": "Gold", "#f4f1ea": "White", "#f2c037": "Gold", "#c9cdd1": "Silver",
  "#c6a96a": "Gold", "#b5bbbf": "Silver", "#f3cc2f": "Gold", "#f3c13a": "Gold", "#f6c445": "Gold",
  "#b9c0c4": "Silver", "#f2b632": "Gold", "#1c1b1a": "Black",
};
const BLACK = "#1c1b1a";

// Team headwear and apparel.
for (const t of TEAMS) {
  const [main, fam] = t.primary;
  const home = cw(`${fam} / ${SECONDARY_NAME[t.secondary] ?? "Contrast"}`, fam, main, main, t.secondary, {
    under: "#2f3a2f",
    button: main,
  });
  // Second colourway always keeps the mark legible against the crown.
  const alt =
    fam === "Black"
      ? cw("Bone / Black", "White", "#e9e4da", BLACK, BLACK, { under: "#3d4a3c", button: BLACK })
      : cw(`Black / ${SECONDARY_NAME[t.secondary] ?? "Contrast"}`, "Black", BLACK, BLACK, t.secondary === "#1c1b1a" ? main : t.secondary, { under: "#2a2a2a" });
  const bone = cw("Bone / Team", "White", "#e9e4da", main, main, { under: "#4a5a48", button: main });

  add({
    name: `${t.name} ${TYPE_LABEL.fitted}`,
    type: "fitted",
    brand: "New Era",
    league: t.league,
    team: t.name,
    mark: t.code,
    price: BASE_PRICE.fitted + pick([0, 0, 4]),
    colorways: rand() > 0.4 ? [home, alt] : [home, alt, bone],
    description: `A high-crown fitted cap for ${t.name} fans, with raised front embroidery and a flat visor. Sized fit, so check the guide before you order.`,
    isNew: rand() > 0.7,
  });
  add({
    name: `${t.name} ${TYPE_LABEL.snapback}`,
    type: "snapback",
    brand: pick(["New Era", "'47"]),
    league: t.league,
    team: t.name,
    mark: t.code,
    price: BASE_PRICE.snapback + pick([0, 2]),
    colorways: [rand() > 0.5 ? home : bone, alt],
    description: `A structured snapback in ${t.name} colours. Flat visor, six panels, one size that adjusts at the back.`,
    isNew: rand() > 0.75,
  });
  if (rand() > 0.45)
    add({
      name: `${t.name} ${TYPE_LABEL.trucker}`,
      type: "trucker",
      brand: "'47",
      league: t.league,
      team: t.name,
      mark: t.code,
      price: BASE_PRICE.trucker,
      colorways: [cw("Team / Mesh", fam, main, main, t.secondary, { trim: "#e9e4da", under: "#2f3a2f" })],
      description: `Foam front, mesh back and a pre-curved visor. An easy everyday ${t.name} cap.`,
      isNew: rand() > 0.6,
    });
  // Every team gets a beanie: sports hats and beanies are the store's core.
  add({
      name: `${t.name} ${TYPE_LABEL.beanie}`,
      type: "beanie",
      brand: pick(["New Era", "'47"]),
      league: t.league,
      team: t.name,
      mark: t.code,
      price: BASE_PRICE.beanie,
      // Cuff in the team's second colour, lettering in the main colour so it stays legible.
      colorways: [cw("Team Knit", fam, main, main, main, { trim: t.secondary === "#f4f1ea" ? "#e4ded3" : t.secondary })],
      description: `A rib-knit cuffed beanie with the ${t.name} city mark stitched on the cuff.`,
      isNew: rand() > 0.7,
    });
  if (rand() > 0.55)
    add({
      name: `${t.name} ${TYPE_LABEL.hoodie}`,
      type: "hoodie",
      brand: "New Era",
      league: t.league,
      team: t.name,
      mark: t.code,
      price: BASE_PRICE.hoodie,
      colorways: [cw(`${fam} Fleece`, fam, main, main, t.secondary, { trim: t.secondary })],
      description: `Midweight fleece hoodie in ${t.name} colours with an embroidered chest mark.`,
      isNew: rand() > 0.7,
    });
}

// HatWear's own blanks and originals (concept designs for the demo).
const originals: Parameters<typeof add>[0][] = [
  {
    name: "Crown Mark Fitted",
    type: "fitted",
    brand: "HatWear",
    mark: "HW",
    price: 44,
    colorways: [
      cw("Navy / White", "Navy", "#1d3557", "#1d3557", "#ffffff", { under: "#2a3a52" }),
      cw("White / Navy", "White", "#f1f3f6", "#1d3557", "#1d3557", { under: "#3d4a3c" }),
      cw("Black / White", "Black", BLACK, BLACK, "#ffffff", { under: "#2a2a2a" }),
    ],
    description: "HatWear's own high-crown fitted with the six-panel crown mark stitched on the front. Concept design for this preview.",
    isNew: true,
  },
  {
    name: "209 Patch Snapback",
    type: "snapback",
    brand: "HatWear",
    mark: "209",
    price: 36,
    colorways: [
      cw("Navy / White", "Navy", "#1d3557", "#1d3557", "#ffffff", { under: "#2a3a52" }),
      cw("Black / Sign Blue", "Black", BLACK, BLACK, "#5b8def", { under: "#2a2a2a" }),
    ],
    description: "A structured snapback with a stitched 209 front. Concept design for this preview.",
    isNew: true,
  },
  {
    name: "Yokuts Ave Dad Cap",
    type: "adjustable",
    brand: "HatWear",
    mark: "YOKUTS",
    price: 28,
    colorways: [
      cw("Washed Tan", "Tan", "#c9b48f", "#c9b48f", "#3a2b20", { under: "#c9b48f" }),
      cw("Washed Black", "Black", "#2a2927", "#2a2927", "#efebe4", { under: "#2a2927" }),
      cw("Washed Green", "Green", "#4f5e43", "#4f5e43", "#efebe4", { under: "#4f5e43" }),
    ],
    description: "A low, soft dad cap in washed twill with a small street-name stitch. Concept design for this preview.",
    isNew: true,
  },
  {
    name: "Stitch Script Trucker",
    type: "trucker",
    brand: "HatWear",
    mark: "HW",
    price: 30,
    colorways: [
      cw("Navy / White Mesh", "Navy", "#1d3557", "#1d3557", "#ffffff", { trim: "#eef1f5" }),
      cw("Black / Black Mesh", "Black", BLACK, BLACK, "#ffffff", { trim: "#2a2927" }),
    ],
    description: "Foam-front trucker with a stitched HW mark. Concept design for this preview.",
    isNew: true,
  },
  {
    name: "Ribbed Cuff Beanie",
    type: "beanie",
    brand: "HatWear",
    mark: "HATWEAR",
    price: 24,
    colorways: [
      cw("Navy", "Navy", "#1d3557", "#1d3557", "#ffffff", { trim: "#182d4a" }),
      cw("Black", "Black", BLACK, BLACK, "#ffffff", { trim: "#2a2927" }),
      cw("Oatmeal", "Tan", "#d8cdb9", "#d8cdb9", "#1c1b1a", { trim: "#cbbfa8" }),
    ],
    description: "A heavy rib-knit beanie with a woven HATWEAR cuff label. Concept design for this preview.",
    isNew: false,
  },
  {
    name: "Crown Heavyweight Hoodie",
    type: "hoodie",
    brand: "HatWear",
    mark: "HW",
    price: 64,
    colorways: [
      cw("Navy", "Navy", "#1d3557", "#1d3557", "#ffffff", { trim: "#ffffff" }),
      cw("White", "White", "#eef1f5", "#eef1f5", "#1d3557", { trim: "#1d3557" }),
    ],
    description: "Heavyweight fleece hoodie with the crown mark stitched at the chest. Concept design for this preview.",
    isNew: true,
  },
  {
    name: "Panel Windbreaker",
    type: "windbreaker",
    brand: "HatWear",
    mark: "HW",
    price: 72,
    colorways: [
      cw("Navy / White", "Navy", "#1d3557", "#eef1f5", "#ffffff", { trim: "#ffffff" }),
      cw("White / Navy", "White", "#eef1f5", "#1d3557", "#1d3557", { trim: "#1d3557" }),
    ],
    description: "A light colour-blocked windbreaker that packs into its own pocket. Concept design for this preview.",
    isNew: true,
  },
  {
    name: "Blank Fitted, Embroidery Ready",
    type: "fitted",
    brand: "HatWear",
    mark: "",
    price: 32,
    colorways: [
      cw("Black", "Black", BLACK, BLACK, "#efebe4", { under: "#2a2a2a" }),
      cw("Navy", "Navy", "#1d3557", "#1d3557", "#ffffff"),
      cw("White", "White", "#eef1f5", "#eef1f5", "#1d3557"),
    ],
    description: "A clean fitted with nothing on it yet. Send it to the embroidery studio and put your own mark on the front.",
    isNew: false,
    embroideryReady: true,
  },
  {
    name: "Blank Snapback, Embroidery Ready",
    type: "snapback",
    brand: "HatWear",
    mark: "",
    price: 24,
    colorways: [
      cw("Black", "Black", BLACK, BLACK, "#efebe4", { under: "#2a2a2a" }),
      cw("Charcoal", "Charcoal", "#3a3936", "#3a3936", "#efebe4"),
      cw("Bone / Black Visor", "White", "#e9e4da", BLACK, "#1c1b1a"),
    ],
    description: "A structured blank snapback, ready for your text or logo in the embroidery studio.",
    isNew: false,
    embroideryReady: true,
  },
  {
    name: "Blank Trucker, Embroidery Ready",
    type: "trucker",
    brand: "HatWear",
    mark: "",
    price: 20,
    colorways: [
      cw("Black / Black Mesh", "Black", BLACK, BLACK, "#efebe4", { trim: "#2a2927" }),
      cw("White / Black Mesh", "White", "#ece8e0", BLACK, "#1c1b1a", { trim: "#2a2927" }),
    ],
    description: "Foam-front trucker blank. A favourite base for team names, business logos and event runs.",
    isNew: false,
    embroideryReady: true,
  },
];
originals.push(
  {
    name: "HatWear Navy Bucket Hat",
    type: "bucket",
    brand: "HatWear",
    mark: "HW",
    price: 34,
    colorways: [
      cw("Navy", "Navy", "#1d3557", "#1d3557", "#ffffff", { under: "#1d3557" }),
      cw("Black", "Black", BLACK, BLACK, "#ffffff", { under: BLACK }),
      cw("Tan", "Tan", "#c9b48f", "#c9b48f", "#1d3557", { under: "#c9b48f" }),
    ],
    description: "A soft cotton bucket hat with a stitched HW front. Concept design for this preview.",
    isNew: true,
  },
  {
    name: "HatWear Pom Beanie",
    type: "beanie",
    style: "pom-beanie",
    brand: "HatWear",
    mark: "HATWEAR",
    price: 28,
    colorways: [
      cw("Navy / White", "Navy", "#1d3557", "#1d3557", "#ffffff", { trim: "#ffffff" }),
      cw("White / Navy", "White", "#eef1f5", "#eef1f5", "#1d3557", { trim: "#1d3557" }),
    ],
    description: "A cuffed rib-knit beanie topped with a pom, with a woven HATWEAR label. Concept design for this preview.",
    isNew: true,
  },
  {
    name: "Golden State Warriors Stretch Fit",
    type: "fitted",
    style: "stretch-fit",
    brand: "New Era",
    league: "NBA",
    team: "Golden State Warriors",
    mark: "GSW",
    price: 40,
    sizes: ["S/M", "M/L", "L/XL"],
    colorways: [cw("Royal / Gold", "Royal", "#24468a", "#24468a", "#f6c445")],
    description: "A stretch-fit cap in Warriors colours: structured crown and a flexible band that fits without sizing.",
    isNew: true,
  },
);
originals.forEach(add);

/** Sample products used until a real catalog (Clover) is connected. */
export const sampleCatalog: Product[] = products;

export const LEAGUES: League[] = ["MLB", "NFL", "NBA"];

export const TEAMS_BY_LEAGUE: Record<League, string[]> = {
  MLB: TEAMS.filter((t) => t.league === "MLB").map((t) => t.name),
  NFL: TEAMS.filter((t) => t.league === "NFL").map((t) => t.name),
  NBA: TEAMS.filter((t) => t.league === "NBA").map((t) => t.name),
};

export const TEAM_CODES: Record<string, string> = Object.fromEntries(TEAMS.map((t) => [t.name, t.code]));

export const TYPE_LABELS = TYPE_LABEL;
