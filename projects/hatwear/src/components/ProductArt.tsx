/**
 * Parametric product illustrations (caps, beanies, hoodies, windbreakers).
 *
 * These stand in for product photography until the store supplies real
 * photos. They are drawn, not photographed, and are labelled as illustrations
 * wherever they appear, so they never misrepresent actual merchandise.
 */
import type { ArtColors, ProductType } from "@/data/types";

export type ArtView = "front" | "side" | "back" | "detail";

export type Placement =
  | "front"
  | "side"
  | "back"
  | "cuff"
  | "left-chest"
  | "center-chest"
  | "full-back";

export interface EmbroideryOverlay {
  placement: Placement;
  text?: string;
  font?: "block" | "athletic" | "script";
  thread: string;
  /** Object URL or data URL of customer artwork. */
  image?: string;
}

interface Props {
  type: ProductType;
  colors: ArtColors;
  mark?: string;
  view?: ArtView;
  embroidery?: EmbroideryOverlay;
  title?: string;
  className?: string;
  /** Draw the soft floor shadow (off for tight crops). */
  shadow?: boolean;
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

/** Lighten (amt > 0) or darken (amt < 0) a hex colour. */
export function shade(hex: string, amt: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function luminance(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

const FONT: Record<NonNullable<EmbroideryOverlay["font"]>, { family: string; weight: number; style?: string; spacing: number }> = {
  block: { family: "var(--font-display), Impact, sans-serif", weight: 800, spacing: 1 },
  athletic: { family: "var(--font-sans), Arial, sans-serif", weight: 800, spacing: 0, style: "italic" },
  script: { family: "var(--font-script), 'Brush Script MT', cursive", weight: 400, spacing: 0 },
};

function markSize(text: string, base: number) {
  const n = text.length;
  if (n <= 2) return base;
  if (n === 3) return base * 0.8;
  if (n <= 5) return base * 0.56;
  if (n <= 8) return base * 0.42;
  return Math.max(base * 0.24, (base * 3.2) / n);
}

const HAT_SHAPES = {
  high: {
    crown: "M96 258 C92 186 112 112 200 102 C288 112 308 186 304 258 Z",
    seams: ["M200 102 L200 258", "M200 102 C170 128 150 190 146 258", "M200 102 C230 128 250 190 254 258"],
    edgeSeams: ["M200 102 C146 114 114 176 104 248", "M200 102 C254 114 286 176 296 248"],
    eyelets: [[148, 152], [252, 152]] as [number, number][],
    button: [200, 102] as [number, number],
    markY: 186,
    truckerFront: "M200 102 C150 112 122 178 118 258 L282 258 C278 178 250 112 200 102 Z",
  },
  low: {
    crown: "M98 258 C96 198 130 140 200 136 C270 140 304 198 302 258 Z",
    seams: ["M200 136 L200 258", "M200 136 C172 160 152 206 148 258", "M200 136 C228 160 248 206 252 258"],
    edgeSeams: ["M200 136 C152 146 118 196 106 250", "M200 136 C248 146 282 196 294 250"],
    eyelets: [[156, 182], [244, 182]] as [number, number][],
    button: [200, 136] as [number, number],
    markY: 214,
    truckerFront: "M200 136 C152 146 122 200 118 258 L282 258 C278 200 248 146 200 136 Z",
  },
};

export function ProductArt({
  type,
  colors,
  mark = "",
  view = "front",
  embroidery,
  title,
  className,
  shadow = true,
}: Props) {
  const id = `pa${hash(JSON.stringify([type, colors, mark, view, embroidery?.thread, embroidery?.placement, embroidery?.text]))}`;
  const ref = (n: string) => `url(#${id}-${n})`;
  const isApparel = type === "hoodie" || type === "windbreaker";
  const lightCrown = luminance(colors.crown) > 0.72;

  const viewBox =
    view === "detail"
      ? type === "beanie"
        ? "120 200 160 160"
        : isApparel
          ? "180 150 120 120"
          : "118 120 164 164"
      : "0 0 400 400";

  // Which placement is drawn on which view.
  const overlayFor = (v: ArtView): EmbroideryOverlay | undefined => {
    if (!embroidery) return undefined;
    const p = embroidery.placement;
    const front = v === "front" || v === "detail";
    if (front && (p === "front" || p === "cuff" || p === "left-chest" || p === "center-chest")) return embroidery;
    if (v === "side" && p === "side") return embroidery;
    if (v === "back" && (p === "back" || p === "full-back")) return embroidery;
    return undefined;
  };
  const overlay = overlayFor(view);
  // Custom work replaces the stock front mark.
  const showMark = !(embroidery && ["front", "cuff", "left-chest", "center-chest"].includes(embroidery.placement));

  const defs = (
    <defs>
      <pattern id={`${id}-twill`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
        <rect width="6" height="6" fill="transparent" />
        <line x1="0" y1="0" x2="0" y2="6" stroke={lightCrown ? "rgba(0,0,0,.07)" : "rgba(255,255,255,.06)"} strokeWidth="2" />
      </pattern>
      <pattern id={`${id}-mesh`} width="7" height="7" patternUnits="userSpaceOnUse">
        <rect width="7" height="7" fill={colors.trim ?? "#e9e4da"} />
        <circle cx="3.5" cy="3.5" r="1.9" fill={shade(colors.trim ?? "#e9e4da", -0.45)} />
      </pattern>
      <pattern id={`${id}-rib`} width="9" height="9" patternUnits="userSpaceOnUse">
        <rect width="9" height="9" fill="transparent" />
        <rect x="6" width="3" height="9" fill="rgba(0,0,0,.16)" />
        <rect x="0" width="1.5" height="9" fill="rgba(255,255,255,.07)" />
      </pattern>
      <radialGradient id={`${id}-light`} cx="0.36" cy="0.26" r="0.8">
        <stop offset="0" stopColor="#fff" stopOpacity={lightCrown ? 0.35 : 0.2} />
        <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity={lightCrown ? 0.18 : 0.32} />
      </radialGradient>
      <linearGradient id={`${id}-visor`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.12" />
        <stop offset="1" stopColor="#000" stopOpacity="0.22" />
      </linearGradient>
      <filter id={`${id}-raise`} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1.6" stdDeviation="0.9" floodColor="#000" floodOpacity="0.45" />
      </filter>
      <filter id={`${id}-floor`} x="-50%" y="-200%" width="200%" height="500%">
        <feGaussianBlur stdDeviation="10" />
      </filter>
      {[colors.mark, embroidery?.thread].filter(Boolean).map((c, i) => (
        <pattern key={i} id={`${id}-satin${i}`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
          <rect width="4" height="4" fill={c} />
          <rect width="4" height="1.3" fill={shade(c!, -0.22)} />
          <rect y="2" width="4" height="0.6" fill={shade(c!, 0.25)} />
        </pattern>
      ))}
    </defs>
  );

  const stitch = (d: string, color: string, key?: string | number, w = 1.4) => (
    <path key={key} d={d} fill="none" stroke={color} strokeWidth={w} strokeDasharray="4 3.2" strokeLinecap="round" />
  );

  const embroideredText = (
    text: string,
    x: number,
    y: number,
    size: number,
    satin: string,
    fontKey: EmbroideryOverlay["font"] = "block",
    transform?: string,
  ) => {
    const f = FONT[fontKey];
    return (
      <text
        x={x}
        y={y}
        transform={transform}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={f.family}
        fontWeight={f.weight}
        fontStyle={f.style}
        letterSpacing={f.spacing}
        fontSize={size}
        fill={satin}
        stroke="rgba(0,0,0,.28)"
        strokeWidth={size > 40 ? 1.1 : 0.6}
        paintOrder="stroke"
        filter={ref("raise")}
      >
        {text}
      </text>
    );
  };

  const overlayArt = (cx: number, cy: number, box: number, o: EmbroideryOverlay) => {
    const satin = ref(colors.mark === o.thread ? "satin0" : "satin1");
    return (
      <g data-embroidery-preview>
        {o.image ? (
          <image
            href={o.image}
            x={cx - box / 2}
            y={cy - box / 2}
            width={box}
            height={box}
            preserveAspectRatio="xMidYMid meet"
            filter={ref("raise")}
          />
        ) : o.text ? (
          embroideredText(o.text, cx, cy, markSize(o.text, box * 0.9), satin, o.font)
        ) : null}
      </g>
    );
  };

  const floor = shadow && view !== "detail" && <ellipse cx="200" cy={isApparel ? 352 : type === "beanie" ? 322 : 334} rx={isApparel ? 140 : type === "beanie" ? 110 : 120} ry="12" fill="#000" opacity="0.22" filter={ref("floor")} />;

  let body: React.ReactNode;

  if (type === "beanie") {
    const knit = colors.crown;
    const cuff = colors.trim ?? shade(knit, -0.1);
    const label = mark.length > 4;
    body = (
      <g>
        <path d="M112 300 L112 178 C112 112 152 84 200 84 C248 84 288 112 288 178 L288 300 Z" fill={knit} />
        <path d="M112 300 L112 178 C112 112 152 84 200 84 C248 84 288 112 288 178 L288 300 Z" fill={ref("rib")} />
        <path d="M112 300 L112 178 C112 112 152 84 200 84 C248 84 288 112 288 178 L288 300 Z" fill={ref("light")} />
        <path d="M104 226 L296 226 L298 306 C240 314 160 314 102 306 Z" fill={cuff} />
        <path d="M104 226 L296 226 L298 306 C240 314 160 314 102 306 Z" fill={ref("rib")} />
        <path d="M104 226 L296 226 L298 306 C240 314 160 314 102 306 Z" fill={ref("visor")} />
        <path d="M104 226 L296 226" stroke="rgba(0,0,0,.25)" strokeWidth="3" />
        {view !== "back" && showMark && mark && (
          label ? (
            <g>
              <rect x="156" y="250" width="88" height="30" rx="2" fill={colors.mark === "#1c1b1a" ? "#efebe4" : "#1c1b1a"} />
              {stitch("M160 254 H240 V276 H160 Z", colors.mark === "#1c1b1a" ? "#b9b2a6" : "#4a4844", "l", 0.9)}
              <text x="200" y="266" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-display), sans-serif" fontWeight={800} fontSize="17" letterSpacing="2" fill={colors.mark}>
                {mark}
              </text>
            </g>
          ) : (
            embroideredText(mark, 200, 266, markSize(mark, 52), ref("satin0"))
          )
        )}
        {overlay && overlayArt(200, 266, 70, overlay)}
      </g>
    );
  } else if (isApparel) {
    const hoodie = type === "hoodie";
    const bodyPath =
      "M120 128 L86 150 L54 300 L90 310 L112 216 L112 344 L288 344 L288 216 L310 310 L346 300 L314 150 L280 128 C262 146 238 156 200 156 C162 156 138 146 120 128 Z";
    const back = view === "back";
    body = (
      <g>
        {hoodie && !back && (
          <path d="M128 134 C130 80 162 56 200 56 C238 56 270 80 272 134 C252 152 228 158 200 158 C172 158 148 152 128 134 Z" fill={shade(colors.crown, -0.12)} />
        )}
        <path d={bodyPath} fill={colors.crown} />
        {!hoodie && (
          <g clipPath={`url(#${id}-clip)`}>
            <clipPath id={`${id}-clip`}>
              <path d={bodyPath} />
            </clipPath>
            <rect x="40" y="172" width="320" height="46" fill={colors.visor} />
            <rect x="40" y="218" width="320" height="4" fill={colors.trim ?? colors.visor} opacity="0.7" />
          </g>
        )}
        <path d={bodyPath} fill={ref("twill")} />
        <path d={bodyPath} fill={ref("light")} />
        {/* Ribbed cuffs and hem */}
        <path d="M112 330 L288 330 L288 344 L112 344 Z" fill={shade(colors.crown, -0.18)} />
        <path d="M56 292 L90 300 L88 310 L54 302 Z" fill={shade(colors.crown, -0.18)} />
        <path d="M344 292 L310 300 L312 310 L346 302 Z" fill={shade(colors.crown, -0.18)} />
        {stitch("M112 216 L120 128", "rgba(0,0,0,.25)", "s1", 1)}
        {stitch("M288 216 L280 128", "rgba(0,0,0,.25)", "s2", 1)}
        {hoodie && back && (
          <path d="M126 136 C126 76 164 50 200 50 C236 50 274 76 274 136 C256 164 144 164 126 136 Z" fill={shade(colors.crown, -0.06)} />
        )}
        {hoodie && back && <path d="M126 136 C126 76 164 50 200 50 C236 50 274 76 274 136 C256 164 144 164 126 136 Z" fill={ref("light")} />}
        {hoodie && !back && (
          <g>
            <path d="M156 140 C160 100 178 82 200 82 C222 82 240 100 244 140 C228 152 214 156 200 156 C186 156 172 152 156 140 Z" fill={shade(colors.crown, -0.5)} />
            <path d="M186 156 L182 214" stroke={colors.trim ?? "#efebe4"} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M214 156 L218 214" stroke={colors.trim ?? "#efebe4"} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M138 262 L262 262 L278 326 L122 326 Z" fill="rgba(0,0,0,.08)" />
            {stitch("M142 266 L258 266 L272 322 L128 322 Z", "rgba(0,0,0,.28)", "pk", 1)}
          </g>
        )}
        {!hoodie && (
          <g>
            <path d="M150 128 L200 152 L250 128 L246 106 C228 116 172 116 154 106 Z" fill={shade(colors.crown, -0.1)} />
            {!back && <path d="M200 152 L200 344" stroke="#9a9894" strokeWidth="3" strokeDasharray="2 2" />}
          </g>
        )}
        {view !== "back" && showMark && mark && embroideredText(mark, 244, 200, markSize(mark, 30), ref("satin0"))}
        {overlay &&
          (overlay.placement === "left-chest"
            ? overlayArt(244, 200, 46, overlay)
            : overlay.placement === "center-chest"
              ? overlayArt(200, 222, 110, overlay)
              : overlayArt(200, 222, 130, overlay))}
      </g>
    );
  } else {
    const shape = type === "adjustable" ? HAT_SHAPES.low : HAT_SHAPES.high;
    const trucker = type === "trucker";
    const curved = type === "adjustable" || type === "trucker";
    const closure = type === "fitted" ? "closed" : type === "adjustable" ? "strap" : "snap";
    const visorFront = curved
      ? "M98 252 C130 246 270 246 302 252 C330 276 318 326 200 334 C82 326 70 276 98 252 Z"
      : "M94 252 C130 247 270 247 306 252 C326 282 306 322 200 326 C94 322 74 282 94 252 Z";

    if (view === "side") {
      const crownSide =
        type === "adjustable"
          ? "M134 262 C126 196 170 142 236 142 C296 144 322 198 318 262 Z"
          : "M132 262 C120 176 170 108 238 108 C300 110 324 180 318 262 Z";
      const top: [number, number] = type === "adjustable" ? [236, 142] : [238, 108];
      body = (
        <g>
          <path d={curved ? "M150 258 C112 258 62 268 36 286 C30 292 38 298 52 296 C92 290 128 278 154 270 Z" : "M146 256 C112 256 62 262 38 270 C32 274 38 280 54 280 C94 280 130 274 152 268 Z"} fill={colors.under} />
          <path d={curved ? "M150 256 C112 254 62 262 36 280 C34 286 40 290 52 288 C92 282 128 272 154 264 Z" : "M146 252 C112 252 62 258 38 266 C34 270 40 274 54 274 C94 274 130 268 152 262 Z"} fill={colors.visor} />
          <path d={curved ? "M150 256 C112 254 62 262 36 280 C34 286 40 290 52 288 C92 282 128 272 154 264 Z" : "M146 252 C112 252 62 258 38 266 C34 270 40 274 54 274 C94 274 130 268 152 262 Z"} fill={ref("visor")} />
          {trucker ? (
            <g>
              <path d={crownSide} fill={ref("mesh")} />
              <path d={type === "trucker" ? "M132 262 C120 176 170 108 238 108 C226 150 218 210 220 262 Z" : crownSide} fill={colors.crown} />
            </g>
          ) : (
            <path d={crownSide} fill={colors.crown} />
          )}
          <path d={crownSide} fill={ref("twill")} />
          <path d={crownSide} fill={ref("light")} />
          {stitch(`M${top[0]} ${top[1]} C220 ${top[1] + 42} 214 200 216 262`, "rgba(0,0,0,.3)", "a")}
          {stitch(`M${top[0]} ${top[1]} C266 ${top[1] + 42} 290 200 300 262`, "rgba(0,0,0,.3)", "b")}
          <circle cx="264" cy={type === "adjustable" ? 186 : 160} r="4.5" fill={shade(colors.crown, -0.4)} stroke={shade(colors.crown, 0.2)} strokeWidth="1.2" />
          {closure !== "closed" && (
            <g>
              <path d="M292 262 C292 238 314 232 318 262 Z" fill="#141414" />
              <rect x="290" y="250" width="30" height="8" rx="2" fill={closure === "strap" ? shade(colors.crown, -0.2) : "#1c1b1a"} />
              {closure === "strap" && <rect x="296" y="248" width="10" height="12" rx="1.5" fill="#b8b3a8" />}
            </g>
          )}
          <path d="M132 262 L318 262" stroke="rgba(0,0,0,.35)" strokeWidth="3" />
          <ellipse cx={top[0]} cy={top[1]} rx="12" ry="5" fill={colors.button} />
          <ellipse cx={top[0]} cy={top[1] - 1} rx="12" ry="5" fill={ref("light")} />
          {showMark && mark && embroideredText(mark, 176, type === "adjustable" ? 214 : 196, markSize(mark, 70) * 0.85, ref("satin0"), "block", `skewY(-6) scale(0.62 1) translate(${176 * 0.61} ${176 * 0.105})`)}
          {overlay && overlayArt(262, type === "adjustable" ? 222 : 212, 64, overlay)}
        </g>
      );
    } else {
      const back = view === "back";
      body = (
        <g>
          {back ? (
            <path d="M84 250 C130 244 270 244 316 250 C322 264 296 274 200 274 C104 274 78 264 84 250 Z" fill={shade(colors.visor, -0.25)} />
          ) : (
            <g>
              <path d={visorFront} fill={colors.visor} />
              <path d={visorFront} fill={ref("visor")} />
              {[10, 22, 34].map((d, i) =>
                stitch(
                  curved
                    ? `M${92 + d * 0.5} ${270 + d * 0.15} C${96 + d} ${312 - d * 0.5} ${304 - d} ${312 - d * 0.5} ${308 - d * 0.5} ${270 + d * 0.15}`
                    : `M${88 + d * 0.5} ${268 + d * 0.1} C${92 + d} ${308 - d * 0.6} ${308 - d} ${308 - d * 0.6} ${312 - d * 0.5} ${268 + d * 0.1}`,
                  luminance(colors.visor) > 0.6 ? "rgba(0,0,0,.22)" : "rgba(255,255,255,.18)",
                  `v${i}`,
                  1.1,
                ),
              )}
            </g>
          )}
          {trucker ? (
            <g>
              <path d={shape.crown} fill={ref("mesh")} />
              {!back && <path d={shape.truckerFront} fill={colors.crown} />}
            </g>
          ) : (
            <path d={shape.crown} fill={colors.crown} />
          )}
          <path d={shape.crown} fill={ref("twill")} />
          <path d={shape.crown} fill={ref("light")} />
          {[...shape.seams, ...shape.edgeSeams].map((d, i) => (
            <path key={`seam${i}`} d={d} fill="none" stroke="rgba(0,0,0,.28)" strokeWidth="1.6" />
          ))}
          {shape.seams.slice(1).map((d, i) => stitch(d, lightCrown ? "rgba(0,0,0,.22)" : "rgba(255,255,255,.16)", `st${i}`, 1))}
          {shape.eyelets.map(([x, y], i) => (
            <g key={`e${i}`}>
              <circle cx={x} cy={y} r="5" fill={shade(colors.crown, lightCrown ? -0.25 : 0.12)} />
              <circle cx={x} cy={y} r="2.2" fill={shade(colors.crown, -0.6)} />
            </g>
          ))}
          {back && closure !== "closed" && (
            <g>
              <path d="M168 258 C168 220 232 220 232 258 Z" fill="#141414" />
              {closure === "snap" ? (
                <g>
                  <rect x="150" y="246" width="100" height="12" rx="3" fill="#1c1b1a" />
                  {[166, 180, 194, 208, 222, 236].map((x) => (
                    <circle key={x} cx={x} cy="252" r="2.6" fill="#55524c" />
                  ))}
                </g>
              ) : (
                <g>
                  <rect x="146" y="246" width="108" height="11" rx="2" fill={shade(colors.crown, -0.15)} />
                  <rect x="214" y="243" width="16" height="17" rx="2" fill="#bdb7ab" />
                  <rect x="218" y="247" width="8" height="9" rx="1" fill={shade(colors.crown, -0.15)} />
                </g>
              )}
            </g>
          )}
          <path d="M96 258 L304 258" stroke="rgba(0,0,0,.3)" strokeWidth="2" />
          <ellipse cx={shape.button[0]} cy={shape.button[1]} rx="13" ry="6" fill={colors.button} />
          <ellipse cx={shape.button[0]} cy={shape.button[1] - 1} rx="13" ry="6" fill={ref("light")} />
          {!back && showMark && mark && embroideredText(mark, 200, shape.markY, markSize(mark, type === "adjustable" ? 72 : 96), ref("satin0"))}
          {overlay && (back ? overlayArt(200, 216, 64, overlay) : overlayArt(200, shape.markY, type === "adjustable" ? 100 : 124, overlay))}
        </g>
      );
    }
  }

  return (
    <svg
      viewBox={viewBox}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      preserveAspectRatio="xMidYMid meet"
    >
      {title && <title>{title}</title>}
      {defs}
      {floor}
      {body}
    </svg>
  );
}
