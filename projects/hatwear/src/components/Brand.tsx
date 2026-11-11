/**
 * HatWear brand marks, drawn from the storefront sign: a navy snapback seen
 * from the side with "HW" on the front panel, set between HAT and WEAR.
 *
 * tone="ink"  → for white backgrounds (navy cap, white HW)
 * tone="bone" → for navy backgrounds (navy cap with a white outline, like the lit sign)
 */
export function CapMark({ className, tone = "ink" }: { className?: string; tone?: "ink" | "bone" }) {
  const navy = "#0b1f3a";
  const line = tone === "bone" ? "#ffffff" : navy;
  return (
    <svg viewBox="0 0 120 70" className={className} aria-hidden="true">
      {/* Brim, sweeping forward to the left */}
      <path d="M4 57 C4 49 26 45 50 47 L58 59 C38 64 6 65 4 57 Z" fill={navy} stroke={line} strokeWidth="4" strokeLinejoin="round" />
      {/* Crown */}
      <path d="M40 52 C37 24 55 7 81 7 C104 7 116 23 116 45 L116 55 C96 60 62 60 44 58 Z" fill={navy} stroke={line} strokeWidth="4" strokeLinejoin="round" />
      {/* Front panel seam and button */}
      <path d="M62 10 C53 22 51 38 53 57" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <path d="M77 5.5 L86 5.5" stroke={line === navy ? navy : "#ffffff"} strokeWidth="4" strokeLinecap="round" />
      <text
        x="86"
        y="36"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontFamily="var(--font-sans), Arial Black, sans-serif"
        fontWeight={900}
        fontSize="22"
        style={{ fontVariationSettings: '"wdth" 110' }}
      >
        HW
      </text>
    </svg>
  );
}

/** Kept for backwards compatibility: the old crown mark now renders the cap. */
export const CrownMark = CapMark;

/** HAT [cap] WEAR, as on the sign. */
export function Wordmark({ className, tone = "ink" }: { className?: string; tone?: "ink" | "bone" }) {
  const letters = tone === "bone" ? "text-white" : "text-ink";
  return (
    <span className={`inline-flex items-center gap-[0.12em] ${letters} ${className ?? ""}`}>
      <span className="font-display font-black uppercase leading-none" style={{ fontWeight: 900, fontVariationSettings: '"wdth" 125', letterSpacing: "0.01em" }}>
        Hat
      </span>
      <CapMark className="h-[1.05em] w-auto shrink-0 -translate-y-[0.04em]" tone={tone} />
      <span className="font-display font-black uppercase leading-none" style={{ fontWeight: 900, fontVariationSettings: '"wdth" 125', letterSpacing: "0.01em" }}>
        Wear
      </span>
    </span>
  );
}
