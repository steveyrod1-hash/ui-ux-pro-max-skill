/** The HatWear crown mark: a six-panel cap seen from directly above. */
export function CrownMark({ className, tone = "ink" }: { className?: string; tone?: "ink" | "bone" }) {
  const fill = tone === "ink" ? "#1a1918" : "#efebe4";
  const seam = tone === "ink" ? "#efebe4" : "#1a1918";
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill={fill} />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <line
          key={a}
          x1="24"
          y1="24"
          x2={24 + 22 * Math.cos(((a - 90) * Math.PI) / 180)}
          y2={24 + 22 * Math.sin(((a - 90) * Math.PI) / 180)}
          stroke={seam}
          strokeWidth="1.6"
          opacity="0.9"
        />
      ))}
      <circle cx="24" cy="24" r="17.5" fill="none" stroke={seam} strokeWidth="1.1" strokeDasharray="2.2 2" opacity="0.7" />
      <circle cx="24" cy="24" r="4.6" fill="#d2261c" />
    </svg>
  );
}

/** HATWEAR wordmark. Condensed athletic caps with the crown standing in for the gap. */
export function Wordmark({ className, tone = "ink" }: { className?: string; tone?: "ink" | "bone" }) {
  return (
    <span className={`inline-flex items-center gap-[0.32em] ${className ?? ""}`}>
      <CrownMark className="h-[1.05em] w-[1.05em] shrink-0" tone={tone} />
      <span
        className="font-display font-black uppercase leading-none tracking-[0.02em]"
        style={{ fontWeight: 900 }}
      >
        HatWear
      </span>
    </span>
  );
}
