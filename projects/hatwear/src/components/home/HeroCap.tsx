/**
 * Campaign illustration for the homepage hero: a navy structured HatWear cap
 * with a raised white "HW" embroidered on the front, resting on dark stone.
 *
 * It is a drawing, not a product photo, and is labelled as one where it is
 * shown. Swap in a real photo by setting `site.heroPhoto` once the store has
 * professional photography.
 */
export function HeroCap({ className, title = "Illustration of a navy HatWear cap with HW embroidered in white on the front" }: { className?: string; title?: string }) {
  const crown =
    "M250 512 C236 380 300 240 430 170 C520 122 640 112 740 140 C860 175 930 270 940 390 C945 440 935 480 915 500 C790 540 470 548 250 512 Z";
  const brim = "M255 500 C380 545 560 552 722 528 C704 600 566 664 404 676 C262 686 122 652 96 592 C80 548 150 505 255 500 Z";
  const brimEdge = "M722 528 C704 600 566 664 404 676 C262 686 122 652 96 592";
  const seamA = "M610 134 C500 160 380 290 330 526";
  const seamB = "M614 134 C700 190 760 330 772 534";
  const seamC = "M618 132 C760 150 880 240 918 360";
  const sidePanel = "M614 134 C700 190 760 330 772 534 L860 522 L915 500 C935 470 945 430 940 390 C930 270 860 175 740 140 C690 126 650 126 614 134 Z";
  const leftPanel = "M610 134 C500 160 380 290 330 526 L250 512 C236 380 300 240 430 170 C500 135 560 128 610 134 Z";
  const rock = "M0 780 L0 768 L120 752 L260 760 L420 744 L560 694 L700 598 L790 550 L880 534 L960 546 L1000 540 L1000 780 Z";
  const rockTop = "M560 694 L700 598 L790 550 L880 534 L960 546 L1000 540 L1000 600 L900 588 L780 616 L650 690 Z";
  const rockFacet = "M260 760 L420 744 L560 694 L650 690 L520 742 L380 770 Z";

  return (
    <svg viewBox="0 0 1000 780" className={className} role="img" aria-label={title}>
      <defs>
        <radialGradient id="hc-crown" cx="40%" cy="28%" r="78%">
          <stop offset="0" stopColor="#2f5394" />
          <stop offset="0.42" stopColor="#1a3767" />
          <stop offset="0.78" stopColor="#0f2448" />
          <stop offset="1" stopColor="#0a1a35" />
        </radialGradient>
        <linearGradient id="hc-side" x1="614" y1="0" x2="940" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#020a18" stopOpacity="0.05" />
          <stop offset="1" stopColor="#020a18" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="hc-left" x1="250" y1="200" x2="600" y2="420" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7fa6ec" stopOpacity="0.22" />
          <stop offset="1" stopColor="#7fa6ec" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hc-base" x1="0" y1="360" x2="0" y2="548" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="hc-brim" x1="100" y1="660" x2="720" y2="520" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#284a86" />
          <stop offset="0.45" stopColor="#1a3767" />
          <stop offset="1" stopColor="#0e2244" />
        </linearGradient>
        <radialGradient id="hc-glint" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#bcd2ff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#bcd2ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hc-rock" x1="0" y1="540" x2="0" y2="780" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#21385c" />
          <stop offset="1" stopColor="#0a1629" />
        </linearGradient>
        <radialGradient id="hc-rock-fade" cx="0.58" cy="0.05" r="0.5">
          <stop offset="0.5" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="hc-rock-mask" maskContentUnits="objectBoundingBox">
          <rect width="1" height="1" fill="url(#hc-rock-fade)" />
        </mask>
        {/* Satin stitch: fine diagonal threads */}
        <pattern id="hc-satin" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
          <rect width="7" height="7" fill="#ffffff" />
          <rect width="2" height="7" fill="#e3e9f2" />
        </pattern>
        <linearGradient id="hc-hw-shade" x1="420" y1="250" x2="700" y2="440" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="0.55" stopColor="#0b1f3a" stopOpacity="0" />
          <stop offset="1" stopColor="#0b1f3a" stopOpacity="0.32" />
        </linearGradient>
        <filter id="hc-noise" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1 0.42" numOctaves="2" seed="7" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0" />
        </filter>
        <filter id="hc-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id="hc-hw-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <clipPath id="hc-crown-clip">
          <path d={crown} />
        </clipPath>
        <clipPath id="hc-brim-clip">
          <path d={brim} />
        </clipPath>
        <clipPath id="hc-rock-clip">
          <path d={rock} />
        </clipPath>
      </defs>

      {/* Stone */}
      <g mask="url(#hc-rock-mask)">
        <path d={rock} fill="url(#hc-rock)" />
        <g clipPath="url(#hc-rock-clip)">
          <path d={rockTop} fill="#34507c" opacity="0.45" />
          <path d={rockFacet} fill="#2a4470" opacity="0.35" />
          <path d="M700 598 L780 616 M790 550 L900 588 M560 694 L650 690" stroke="#aab7ca" strokeOpacity="0.18" strokeWidth="2" fill="none" />
        </g>
        <path d="M560 694 L700 598 L790 550 L880 534 L960 546 L1000 540" stroke="#aab7ca" strokeOpacity="0.28" strokeWidth="2" fill="none" />
      </g>

      {/* Contact shadow */}
      <ellipse cx="560" cy="560" rx="380" ry="34" fill="#020814" opacity="0.7" filter="url(#hc-soft)" />
      <ellipse cx="330" cy="700" rx="250" ry="20" fill="#020814" opacity="0.55" filter="url(#hc-soft)" />

      {/* Crown */}
      <path d={crown} fill="url(#hc-crown)" />
      <g clipPath="url(#hc-crown-clip)">
        <rect x="200" y="100" width="760" height="460" filter="url(#hc-noise)" opacity="0.07" />
        <path d={leftPanel} fill="url(#hc-left)" />
        <path d={sidePanel} fill="url(#hc-side)" />
        <ellipse cx="500" cy="225" rx="170" ry="80" fill="url(#hc-glint)" />
        <rect x="200" y="300" width="760" height="260" fill="url(#hc-base)" />

        {/* Seams with twin-needle stitching */}
        {[seamA, seamB, seamC].map((d, i) => (
          <g key={i}>
            <path d={d} stroke="#050f22" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d={d} stroke="#9cc0ff" strokeOpacity="0.16" strokeWidth="1.5" fill="none" transform="translate(-7 2)" strokeDasharray="7 6" />
            <path d={d} stroke="#9cc0ff" strokeOpacity="0.12" strokeWidth="1.5" fill="none" transform="translate(7 -1)" strokeDasharray="7 6" />
          </g>
        ))}

        {/* Eyelets */}
        {[
          [462, 236],
          [706, 206],
          [858, 268],
        ].map(([x, y]) => (
          <g key={x}>
            <ellipse cx={x} cy={y} rx="10" ry="7" fill="#20406f" />
            <ellipse cx={x} cy={y + 0.5} rx="5" ry="3.4" fill="#030a17" />
          </g>
        ))}
      </g>

      {/* Button */}
      <ellipse cx="613" cy="134" rx="30" ry="12" fill="#0d1f3d" />
      <ellipse cx="611" cy="129" rx="27" ry="10" fill="#22457d" />
      <ellipse cx="604" cy="126" rx="12" ry="4" fill="#9cc0ff" opacity="0.25" />

      {/* Raised "HW" embroidery */}
      <g transform="rotate(-5 560 350) skewX(-4)" fontFamily="var(--font-display), 'Arial Black', sans-serif" fontWeight={900} fontStyle="italic" fontSize="176" textAnchor="middle" style={{ fontVariationSettings: '"wdth" 112' }}>
        <text x="580" y="412" fill="#01060f" opacity="0.55" filter="url(#hc-hw-shadow)">
          HW
        </text>
        <text x="576" y="408" fill="#9fb0c8">
          HW
        </text>
        <text x="573" y="404" fill="url(#hc-satin)" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8">
          HW
        </text>
        <text x="573" y="404" fill="url(#hc-hw-shade)">
          HW
        </text>
      </g>

      {/* Brim: underside lip, top surface, rows of stitching */}
      <path d={brimEdge} transform="translate(3 12)" stroke="#06122a" strokeWidth="20" strokeLinecap="round" fill="none" />
      <path d={brim} fill="url(#hc-brim)" />
      <g clipPath="url(#hc-brim-clip)">
        <rect x="80" y="490" width="660" height="210" filter="url(#hc-noise)" opacity="0.07" />
        {[0.92, 0.84, 0.76, 0.68, 0.6].map((k) => (
          <path
            key={k}
            d={brimEdge}
            transform={`translate(${430 * (1 - k)} ${528 * (1 - k)}) scale(${k})`}
            stroke="#9cc0ff"
            strokeOpacity="0.2"
            strokeWidth={1.6 / k}
            strokeDasharray={`${6 / k} ${5 / k}`}
            fill="none"
          />
        ))}
        <path d="M255 500 C380 545 560 552 722 528" stroke="#030a17" strokeOpacity="0.55" strokeWidth="10" fill="none" />
      </g>
      <path d={brimEdge} stroke="#bcd2ff" strokeOpacity="0.22" strokeWidth="2.5" fill="none" />
    </svg>
  );
}
