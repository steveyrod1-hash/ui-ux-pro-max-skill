/**
 * Embroidery studio options and validation, shared by the browser form and
 * the /api/embroidery route so both enforce exactly the same rules.
 */
import type { ArtColors, ProductType } from "@/data/types";
import type { Placement } from "@/components/ProductArt";

export interface BaseColor {
  id: string;
  name: string;
  art: ArtColors;
}

export interface BaseItem {
  type: ProductType;
  label: string;
  note: string;
  colors: BaseColor[];
  placements: { id: Placement; label: string }[];
}

const c = (id: string, name: string, crown: string, visor: string, extra: Partial<ArtColors> = {}): BaseColor => ({
  id,
  name,
  art: { crown, visor, under: extra.under ?? "#2a2a2a", button: extra.button ?? crown, mark: "#efebe4", trim: extra.trim },
});

const HAT_PLACEMENTS: BaseItem["placements"] = [
  { id: "front", label: "Front" },
  { id: "side", label: "Side" },
  { id: "back", label: "Back" },
];

export const BASES: BaseItem[] = [
  {
    type: "fitted",
    label: "Fitted",
    note: "High crown, flat visor, sized",
    placements: HAT_PLACEMENTS,
    colors: [c("black", "Black", "#1c1b1a", "#1c1b1a"), c("navy", "Navy", "#1b2840", "#1b2840"), c("red", "Stitch Red", "#b8241c", "#b8241c"), c("bone", "Bone", "#e9e4da", "#e9e4da", { under: "#4a5a48" })],
  },
  {
    type: "snapback",
    label: "Snapback",
    note: "Flat visor, snap back",
    placements: HAT_PLACEMENTS,
    colors: [c("black", "Black", "#1c1b1a", "#1c1b1a"), c("charcoal", "Charcoal", "#3a3936", "#3a3936"), c("bone-black", "Bone / Black visor", "#e9e4da", "#1c1b1a")],
  },
  {
    type: "trucker",
    label: "Trucker",
    note: "Foam front, mesh back",
    placements: [
      { id: "front", label: "Front" },
      { id: "side", label: "Side" },
    ],
    colors: [c("black", "Black / Black mesh", "#1c1b1a", "#1c1b1a", { trim: "#2a2927" }), c("white", "White / Black mesh", "#ece8e0", "#1c1b1a", { trim: "#2a2927" }), c("red", "Red / White mesh", "#c4231b", "#c4231b", { trim: "#e9e4da" })],
  },
  {
    type: "adjustable",
    label: "Dad cap",
    note: "Low crown, curved visor",
    placements: HAT_PLACEMENTS,
    colors: [c("tan", "Washed Tan", "#c9b48f", "#c9b48f", { under: "#c9b48f" }), c("black", "Washed Black", "#2a2927", "#2a2927", { under: "#2a2927" }), c("green", "Washed Green", "#4f5e43", "#4f5e43", { under: "#4f5e43" })],
  },
  {
    type: "beanie",
    label: "Beanie",
    note: "Cuffed rib knit",
    placements: [{ id: "cuff", label: "Cuff" }],
    colors: [c("black", "Black", "#1c1b1a", "#1c1b1a", { trim: "#2a2927" }), c("red", "Stitch Red", "#b8241c", "#b8241c", { trim: "#a51f18" }), c("oat", "Oatmeal", "#d8cdb9", "#d8cdb9", { trim: "#cbbfa8" })],
  },
  {
    type: "bucket",
    label: "Bucket hat",
    note: "Soft crown, all-round brim",
    placements: [
      { id: "front", label: "Front" },
      { id: "back", label: "Back" },
    ],
    colors: [c("navy", "Navy", "#1d3557", "#1d3557", { under: "#1d3557" }), c("black", "Black", "#1c1b1a", "#1c1b1a", { under: "#1c1b1a" }), c("tan", "Tan", "#c9b48f", "#c9b48f", { under: "#c9b48f" })],
  },
];

/** Placements offered when the customer brings their own item. */
export const OWN_PLACEMENTS: BaseItem["placements"] = [
  { id: "front", label: "Front of the hat" },
  { id: "side", label: "Side of the hat" },
  { id: "back", label: "Back of the hat" },
  { id: "cuff", label: "Beanie cuff" },
];

export function placementsFor(type: ProductType | "own") {
  return type === "own" ? OWN_PLACEMENTS : BASES.find((b) => b.type === type)?.placements ?? [];
}

/** The Madeira thread colours on HatWear's embroidery wall. */
export const THREADS: { id: string; name: string; hex: string }[] = [
  { id: "black", name: "Black", hex: "#1c1c1e" },
  { id: "white", name: "White", hex: "#f4f2ec" },
  { id: "silver", name: "Silver", hex: "#b8bcc2" },
  { id: "navy", name: "Navy", hex: "#1b2a55" },
  { id: "royal", name: "Royal Blue", hex: "#1f5fc4" },
  { id: "turquoise", name: "Turquoise", hex: "#19b6c9" },
  { id: "purple", name: "Purple", hex: "#4a2a9a" },
  { id: "magenta", name: "Magenta", hex: "#a3195b" },
  { id: "hot-pink", name: "Hot Pink", hex: "#ef4f6b" },
  { id: "light-pink", name: "Light Pink", hex: "#f2b6c0" },
  { id: "peach", name: "Peach", hex: "#f3b896" },
  { id: "cream", name: "Cream", hex: "#efe3a9" },
  { id: "gold", name: "Gold", hex: "#f5b81c" },
  { id: "orange", name: "Orange", hex: "#f07a12" },
  { id: "red", name: "Red", hex: "#d8202a" },
  { id: "maroon", name: "Maroon", hex: "#7a1a26" },
  { id: "brown", name: "Brown", hex: "#4f3b25" },
  { id: "forest", name: "Forest Green", hex: "#154a33" },
  { id: "kelly", name: "Kelly Green", hex: "#179a4a" },
  { id: "lime", name: "Lime", hex: "#b5d334" },
];

export const FONTS: { id: "block" | "athletic" | "script"; label: string }[] = [
  { id: "block", label: "Block" },
  { id: "athletic", label: "Athletic italic" },
  { id: "script", label: "Script" },
];

export const LIMITS = {
  textMax: 24,
  notesMax: 1000,
  qtyMin: 1,
  qtyMax: 500,
  fileMaxBytes: 8 * 1024 * 1024,
  fileTypes: ["image/png", "image/jpeg", "image/webp"],
};

export interface EmbroideryRequest {
  baseType: ProductType | "own";
  baseColor: string;
  ownItem?: string;
  text: string;
  font: string;
  placement: Placement;
  thread: string;
  quantity: number;
  notes: string;
  name: string;
  email: string;
  phone: string;
  contactMethod: "email" | "phone" | "text";
  neededBy: string;
  hasArtwork: boolean;
}

export type FieldErrors = Partial<Record<keyof EmbroideryRequest | "artwork" | "design", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function digits(s: string) {
  return s.replace(/\D/g, "");
}

/** Errors for the design step (product + customization). */
export function validateDesign(r: Partial<EmbroideryRequest>): FieldErrors {
  const e: FieldErrors = {};
  const base = BASES.find((b) => b.type === r.baseType);
  if (r.baseType === "own") {
    if (!r.ownItem?.trim()) e.ownItem = "Tell us what item you'll bring in.";
    if ((r.ownItem ?? "").length > 120) e.ownItem = "Keep this under 120 characters.";
    if (!OWN_PLACEMENTS.some((p) => p.id === r.placement)) e.placement = "Choose a placement.";
  } else if (!base) {
    e.baseType = "Choose a product.";
  } else {
    if (!base.colors.some((c) => c.id === r.baseColor)) e.baseColor = "Choose a colour.";
    if (!base.placements.some((p) => p.id === r.placement)) e.placement = "Choose a placement.";
  }
  if (!r.text?.trim() && !r.hasArtwork) e.design = "Add text, upload artwork, or both.";
  if ((r.text ?? "").length > LIMITS.textMax) e.text = `Keep text to ${LIMITS.textMax} characters.`;
  if (r.font && !FONTS.some((f) => f.id === r.font)) e.font = "Choose a lettering style.";
  if (!THREADS.some((t) => t.id === r.thread)) e.thread = "Choose a thread colour.";
  const q = Number(r.quantity);
  if (!Number.isInteger(q) || q < LIMITS.qtyMin || q > LIMITS.qtyMax) e.quantity = `Quantity must be ${LIMITS.qtyMin} to ${LIMITS.qtyMax}.`;
  if ((r.notes ?? "").length > LIMITS.notesMax) e.notes = `Keep notes under ${LIMITS.notesMax} characters.`;
  return e;
}

/** Errors for the contact step. */
export function validateContact(r: Partial<EmbroideryRequest>): FieldErrors {
  const e: FieldErrors = {};
  if (!r.name?.trim() || r.name.trim().length < 2) e.name = "Enter your name.";
  if (r.email && !EMAIL.test(r.email.trim())) e.email = "That email doesn't look right.";
  if (r.phone && digits(r.phone).length < 10) e.phone = "Enter a 10-digit phone number.";
  if (!r.email?.trim() && !r.phone?.trim()) e.email = "Give us an email or a phone number so we can reply.";
  if (r.contactMethod === "email" && !r.email?.trim()) e.email = "Add an email, or choose phone or text.";
  if ((r.contactMethod === "phone" || r.contactMethod === "text") && !r.phone?.trim()) e.phone = "Add a phone number, or choose email.";
  if (r.neededBy) {
    const d = new Date(`${r.neededBy}T12:00:00`);
    if (Number.isNaN(d.getTime())) e.neededBy = "Pick a valid date.";
  }
  return e;
}

export function labelFor(r: EmbroideryRequest) {
  const base = BASES.find((b) => b.type === r.baseType);
  return {
    item: r.baseType === "own" ? `Customer's own item: ${r.ownItem}` : `${base?.label} · ${base?.colors.find((c) => c.id === r.baseColor)?.name}`,
    placement: placementsFor(r.baseType).find((p) => p.id === r.placement)?.label ?? r.placement,
    thread: THREADS.find((t) => t.id === r.thread)?.name ?? r.thread,
    font: FONTS.find((f) => f.id === r.font)?.label ?? r.font,
  };
}
