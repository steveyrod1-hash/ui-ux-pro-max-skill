import { Archivo, Big_Shoulders, Yellowtail } from "next/font/google";

export const display = Big_Shoulders({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-hw-display",
  display: "swap",
});

export const sans = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
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
