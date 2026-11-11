import { Archivo, Yellowtail } from "next/font/google";

/** Archivo carries everything; headings use its wide, heavy cut to match the store sign. */
export const sans = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  style: ["normal", "italic"],
  variable: "--font-hw-sans",
  display: "swap",
});

/** Only used for the "script" embroidery style; not preloaded. */
export const script = Yellowtail({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-hw-script",
  display: "swap",
  preload: false,
});
