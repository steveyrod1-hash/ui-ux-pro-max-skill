export type ProductType =
  | "fitted"
  | "snapback"
  | "trucker"
  | "adjustable"
  | "beanie"
  | "hoodie"
  | "windbreaker";

export type HatType = Extract<ProductType, "fitted" | "snapback" | "trucker" | "adjustable" | "beanie">;

export type League = "MLB" | "NFL" | "NBA";

export type ColorFamily =
  | "Black"
  | "Charcoal"
  | "White"
  | "Navy"
  | "Royal"
  | "Red"
  | "Green"
  | "Purple"
  | "Brown"
  | "Gold"
  | "Tan";

/** Colours used by the illustration system until real photography exists. */
export interface ArtColors {
  crown: string;
  visor: string;
  under: string;
  button: string;
  mark: string;
  /** Trucker mesh / beanie cuff / apparel trim. */
  trim?: string;
}

export interface Colorway {
  id: string;
  name: string;
  family: ColorFamily;
  /** Swatch shown in selectors; usually the crown colour. */
  swatch: string;
  art: ArtColors;
}

export interface ProductImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  type: ProductType;
  brand: string;
  league?: League;
  team?: string;
  /** Short text embroidered on the front of the illustration. */
  mark: string;
  price: number;
  colorways: Colorway[];
  /** Sizes this product is offered in, in display order. */
  sizes: string[];
  /** stock[colorwayId][size] = units on hand. */
  stock: Record<string, Record<string, number>>;
  description: string;
  details: string[];
  care: string[];
  isNew: boolean;
  /** Higher = newer. Drives "Newest" sorting. */
  arrival: number;
  /** Real photography per colourway. When absent, the illustration is shown. */
  images?: Record<string, ProductImage[]>;
  /** Can be sent to the embroidery studio as a base item. */
  embroideryReady?: boolean;
}

export type Availability = "in-stock" | "low-stock" | "sold-out";
