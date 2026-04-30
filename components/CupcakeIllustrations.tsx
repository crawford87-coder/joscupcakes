/**
 * CupcakeIllustrations.tsx
 *
 * All SVG watercolor-style cupcake illustration components.
 * Paths are intentionally organic / imprecise to simulate
 * hand-painted brush strokes and watercolor texture.
 */

// ─── Shared filter definitions ────────────────────────────────────────────────

export function WatercolorFilters() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        {/* Soft blurry watercolor wash */}
        <filter id="wc-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" seed="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="1.5" result="blurred" />
          <feComposite in="blurred" in2="SourceGraphic" operator="atop" />
        </filter>

        {/* Paper grain texture */}
        <filter id="wc-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
          <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" />
        </filter>

        {/* Edge wobble — makes lines feel hand-drawn */}
        <filter id="wc-wobble" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="2" seed="5" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        {/* Glitter shimmer */}
        <filter id="wc-shimmer" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="8" result="noise" />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0" in="noise" result="shimmer" />
          <feBlend in="SourceGraphic" in2="shimmer" mode="screen" />
        </filter>

        {/* Clip paths for cupcake shapes */}
        <clipPath id="liner-clip">
          <path d="M 30,140 Q 25,200 20,220 Q 60,230 100,230 Q 140,230 180,220 Q 175,200 170,140 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

// ─── Paper liner (shared base for all cupcakes) ───────────────────────────────

function PaperLiner({ color = "#F5E8D4", stripeColor = "#EDD8B8" }: { color?: string; stripeColor?: string }) {
  return (
    <g filter="url(#wc-wobble)">
      {/* Liner body — slightly trapezoidal */}
      <path
        d="M 38,148 Q 34,185 28,218 Q 65,228 100,228 Q 135,228 172,218 Q 166,185 162,148 Z"
        fill={color}
        opacity="0.92"
      />
      {/* Liner pleats / ridges */}
      {[44, 54, 64, 74, 84, 94, 104, 114, 124, 134, 144, 154].map((x, i) => (
        <line
          key={i}
          x1={x} y1={148}
          x2={x - 3 + (i % 2) * 4} y2={220}
          stroke={stripeColor}
          strokeWidth="1.2"
          opacity="0.55"
        />
      ))}
      {/* Liner rim / fold */}
      <path
        d="M 36,148 Q 68,142 100,143 Q 132,142 164,148"
        fill="none"
        stroke={stripeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </g>
  );
}

// ─── Cake base ────────────────────────────────────────────────────────────────

function CakeBase({ isChocolate }: { isChocolate: boolean }) {
  const mainColor = isChocolate ? "#7A4828" : "#D4A060";
  const shadowColor = isChocolate ? "#5C3218" : "#BC8850";
  const highlightColor = isChocolate ? "#9A6040" : "#E8C080";

  return (
    <g filter="url(#wc-blur)">
      {/* Main dome */}
      <path
        d="M 36,150 Q 34,138 38,130 Q 52,118 100,116 Q 148,118 162,130 Q 166,138 164,150 Z"
        fill={mainColor}
        opacity="0.95"
      />
      {/* Shadow depth */}
      <path
        d="M 36,150 Q 40,144 52,140 Q 70,135 100,134 L 100,116 Q 52,118 38,130 Z"
        fill={shadowColor}
        opacity="0.3"
      />
      {/* Highlight */}
      <path
        d="M 100,116 Q 126,117 148,128 Q 156,134 160,142 L 164,150 Q 148,136 100,133 Z"
        fill={highlightColor}
        opacity="0.25"
      />
    </g>
  );
}

// ─── Hero cupcake — fully decorated ──────────────────────────────────────────

export function HeroCupcake({ size = 280 }: { size?: number }) {
  const scale = size / 280;
  return (
    <svg
      viewBox="0 0 200 240"
      width={size}
      height={size * (240 / 200)}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Decorated watercolor cupcake illustration"
    >
      <defs>
        <radialGradient id="hero-glow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#FDE4CF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#F1C0E8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Atmospheric glow behind */}
      <ellipse cx="100" cy="120" rx="90" ry="80" fill="url(#hero-glow)" />

      {/* Liner */}
      <PaperLiner color="#F2E0C8" stripeColor="#E0C8A8" />

      {/* Cake base */}
      <CakeBase isChocolate={false} />

      {/* === Five-color frosting swirl === */}
      {/* Layer 1 — lavender base blob */}
      <path
        d="M 38,138 Q 30,110 45,85 Q 62,60 100,55 Q 138,60 155,85 Q 170,110 162,138 Q 138,125 100,122 Q 62,125 38,138 Z"
        fill="#C4AED8"
        opacity="0.85"
        filter="url(#wc-blur)"
      />
      {/* Layer 2 — rose mid swirl */}
      <path
        d="M 48,132 Q 40,108 52,84 Q 68,62 100,58 Q 132,62 148,84 Q 160,108 152,132 Q 132,118 100,116 Q 68,118 48,132 Z"
        fill="#E8A0B0"
        opacity="0.80"
        filter="url(#wc-blur)"
      />
      {/* Layer 3 — peach swirl */}
      <path
        d="M 55,126 Q 50,105 62,84 Q 76,65 100,62 Q 124,65 138,84 Q 150,105 145,126 Q 126,114 100,112 Q 74,114 55,126 Z"
        fill="#F2C9A8"
        opacity="0.80"
        filter="url(#wc-blur)"
      />
      {/* Layer 4 — butter swirl */}
      <path
        d="M 62,118 Q 60,99 72,82 Q 84,66 100,64 Q 116,66 128,82 Q 140,99 138,118 Q 120,108 100,106 Q 80,108 62,118 Z"
        fill="#F0D898"
        opacity="0.75"
        filter="url(#wc-blur)"
      />
      {/* Layer 5 — sky top peak */}
      <path
        d="M 72,108 Q 74,88 82,74 Q 88,62 100,56 Q 112,62 118,74 Q 126,88 128,108 Q 112,100 100,98 Q 88,100 72,108 Z"
        fill="#A8C8E8"
        opacity="0.80"
        filter="url(#wc-blur)"
      />
      {/* Frosting peak tip */}
      <path
        d="M 88,80 Q 92,58 100,46 Q 108,58 112,80 Q 106,74 100,72 Q 94,74 88,80 Z"
        fill="#D4788E"
        opacity="0.75"
        filter="url(#wc-blur)"
      />

      {/* Glitter speckles on frosting */}
      {[
        [75, 100], [88, 88], [112, 85], [125, 98], [95, 108],
        [105, 72], [82, 94], [118, 94], [100, 62],
      ].map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx} cy={cy}
          r={i % 3 === 0 ? 1.8 : 1.2}
          fill={i % 3 === 0 ? "#FFD700" : "#FFF"}
          opacity={0.6 + (i % 3) * 0.1}
        />
      ))}

      {/* Unicorn topper */}
      <g transform="translate(78, 18) scale(0.55)">
        {/* Horn */}
        <path d="M 40,50 Q 38,30 40,10 Q 42,30 44,50 Z" fill="#F0D898" opacity="0.9" />
        <path d="M 39,45 L 37,25 M 41,40 L 43,22" stroke="#E0C060" strokeWidth="1" opacity="0.6" />
        {/* Head */}
        <ellipse cx="40" cy="58" rx="16" ry="14" fill="#FAECD8" opacity="0.95" />
        {/* Mane — watercolor streaks */}
        <path d="M 52,50 Q 58,55 56,70 Q 60,60 62,72" stroke="#E8A0B0" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
        <path d="M 50,48 Q 58,52 58,66" stroke="#C4AED8" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M 54,54 Q 60,58 60,70" stroke="#A8C8E8" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
        {/* Eye */}
        <circle cx="36" cy="56" r="3" fill="#3D2B1F" opacity="0.7" />
        <circle cx="35" cy="55" r="1" fill="#FFF" opacity="0.8" />
        {/* Nostril */}
        <ellipse cx="30" cy="62" rx="2.5" ry="1.5" fill="#E8A0B0" opacity="0.5" />
      </g>

      {/* Watercolor wash on liner bottom — wet edge effect */}
      <path
        d="M 28,218 Q 65,230 100,229 Q 135,230 172,218 Q 168,226 100,234 Q 32,226 28,218 Z"
        fill="#E0C8A8"
        opacity="0.35"
        filter="url(#wc-blur)"
      />
    </svg>
  );
}

// ─── Bare base (no frosting) ──────────────────────────────────────────────────

export function VanillaBase({ size = 200, selected = false }: { size?: number; selected?: boolean }) {
  return (
    <svg
      viewBox="0 0 200 240"
      width={size}
      height={size * (240 / 200)}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Vanilla cupcake base"
      className={selected ? "wc-selected rounded-2xl" : ""}
    >
      <PaperLiner color="#F5EDD8" stripeColor="#E8D8B8" />
      <CakeBase isChocolate={false} />

      {/* Cake texture dots */}
      {[[72,135],[88,130],[104,128],[120,130],[136,135],[80,143],[96,140],[112,140],[128,142]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="2" fill="#BC8850" opacity="0.18" />
      ))}

      {/* Flat top — no frosting, just a smooth cut */}
      <path
        d="M 40,120 Q 68,110 100,108 Q 132,110 160,120"
        fill="none"
        stroke="#D4A060"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Vanilla label */}
      <text x="100" y="200" textAnchor="middle" fontFamily="var(--font-caveat)" fontSize="18" fill="#6B5C52" opacity="0.7">
        vanilla
      </text>
    </svg>
  );
}

export function ChocolateBase({ size = 200, selected = false }: { size?: number; selected?: boolean }) {
  return (
    <svg
      viewBox="0 0 200 240"
      width={size}
      height={size * (240 / 200)}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Chocolate cupcake base"
      className={selected ? "wc-selected rounded-2xl" : ""}
    >
      <PaperLiner color="#EED8C0" stripeColor="#D8C0A0" />
      <CakeBase isChocolate={true} />

      {/* Cake texture */}
      {[[72,135],[88,130],[104,128],[120,130],[136,135],[80,143],[96,140],[112,140],[128,142]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="2" fill="#3D1808" opacity="0.18" />
      ))}

      {/* Flat top */}
      <path
        d="M 40,120 Q 68,110 100,108 Q 132,110 160,120"
        fill="none"
        stroke="#5C3218"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Chocolate label */}
      <text x="100" y="200" textAnchor="middle" fontFamily="var(--font-caveat)" fontSize="18" fill="#6B5C52" opacity="0.7">
        chocolate
      </text>
    </svg>
  );
}

// ─── Frosting swirls ──────────────────────────────────────────────────────────

interface FrostingProps {
  isChocolate: boolean;
  size?: number;
  selected?: boolean;
}

// Three-color swirl
export function ThreeColorFrosting({ isChocolate, size = 200, selected = false }: FrostingProps) {
  const liner = isChocolate
    ? { color: "#EED8C0", stripe: "#D8C0A0" }
    : { color: "#F5EDD8", stripe: "#E8D8B8" };
  return (
    <svg viewBox="0 0 200 240" width={size} height={size * (240/200)} xmlns="http://www.w3.org/2000/svg" aria-label="Three-color frosting swirl">
      <PaperLiner {...liner} />
      <CakeBase isChocolate={isChocolate} />
      {/* Three colors: lavender, peach, sage */}
      <path d="M 40,138 Q 32,110 46,84 Q 64,58 100,54 Q 136,58 154,84 Q 168,110 160,138 Q 136,124 100,121 Q 64,124 40,138 Z" fill="#C4AED8" opacity="0.82" filter="url(#wc-blur)" />
      <path d="M 52,130 Q 48,106 60,82 Q 76,60 100,57 Q 124,60 140,82 Q 152,106 148,130 Q 128,116 100,113 Q 72,116 52,130 Z" fill="#F2C9A8" opacity="0.80" filter="url(#wc-blur)" />
      <path d="M 68,118 Q 68,96 80,78 Q 88,64 100,60 Q 112,64 120,78 Q 132,96 132,118 Q 116,108 100,106 Q 84,108 68,118 Z" fill="#A8C8A8" opacity="0.78" filter="url(#wc-blur)" />
      {/* Peak */}
      <path d="M 88,82 Q 92,62 100,50 Q 108,62 112,82 Q 106,76 100,74 Q 94,76 88,82 Z" fill="#C4AED8" opacity="0.75" filter="url(#wc-blur)" />
    </svg>
  );
}

// Four-color swirl
export function FourColorFrosting({ isChocolate, size = 200, selected = false }: FrostingProps) {
  const liner = isChocolate
    ? { color: "#EED8C0", stripe: "#D8C0A0" }
    : { color: "#F5EDD8", stripe: "#E8D8B8" };
  return (
    <svg viewBox="0 0 200 240" width={size} height={size * (240/200)} xmlns="http://www.w3.org/2000/svg" aria-label="Four-color frosting swirl">
      <PaperLiner {...liner} />
      <CakeBase isChocolate={isChocolate} />
      <path d="M 38,138 Q 30,108 44,82 Q 62,56 100,52 Q 138,56 156,82 Q 170,108 162,138 Q 138,123 100,120 Q 62,123 38,138 Z" fill="#E8A0B0" opacity="0.82" filter="url(#wc-blur)" />
      <path d="M 50,130 Q 44,106 58,80 Q 74,58 100,55 Q 126,58 142,80 Q 156,106 150,130 Q 128,116 100,113 Q 72,116 50,130 Z" fill="#F0D898" opacity="0.80" filter="url(#wc-blur)" />
      <path d="M 62,122 Q 58,100 70,78 Q 82,60 100,56 Q 118,60 130,78 Q 142,100 138,122 Q 120,110 100,108 Q 80,110 62,122 Z" fill="#A8C8E8" opacity="0.78" filter="url(#wc-blur)" />
      <path d="M 76,112 Q 74,94 84,76 Q 90,62 100,58 Q 110,62 116,76 Q 126,94 124,112 Q 112,104 100,102 Q 88,104 76,112 Z" fill="#C4AED8" opacity="0.76" filter="url(#wc-blur)" />
      <path d="M 90,80 Q 92,62 100,50 Q 108,62 110,80 Q 105,74 100,72 Q 95,74 90,80 Z" fill="#E8A0B0" opacity="0.80" filter="url(#wc-blur)" />
    </svg>
  );
}

// Five-color swirl
export function FiveColorFrosting({ isChocolate, size = 200, selected = false }: FrostingProps) {
  const liner = isChocolate
    ? { color: "#EED8C0", stripe: "#D8C0A0" }
    : { color: "#F5EDD8", stripe: "#E8D8B8" };
  return (
    <svg viewBox="0 0 200 240" width={size} height={size * (240/200)} xmlns="http://www.w3.org/2000/svg" aria-label="Five-color frosting swirl">
      <PaperLiner {...liner} />
      <CakeBase isChocolate={isChocolate} />
      <path d="M 36,140 Q 28,106 44,78 Q 62,52 100,48 Q 138,52 156,78 Q 172,106 164,140 Q 138,122 100,119 Q 62,122 36,140 Z" fill="#C4AED8" opacity="0.82" filter="url(#wc-blur)" />
      <path d="M 48,132 Q 42,104 56,78 Q 72,55 100,51 Q 128,55 144,78 Q 158,104 152,132 Q 128,117 100,114 Q 72,117 48,132 Z" fill="#E8A0B0" opacity="0.80" filter="url(#wc-blur)" />
      <path d="M 60,124 Q 56,100 68,76 Q 80,56 100,52 Q 120,56 132,76 Q 144,100 140,124 Q 120,111 100,109 Q 80,111 60,124 Z" fill="#F2C9A8" opacity="0.78" filter="url(#wc-blur)" />
      <path d="M 72,114 Q 70,94 80,74 Q 88,58 100,54 Q 112,58 120,74 Q 130,94 128,114 Q 113,104 100,102 Q 87,104 72,114 Z" fill="#F0D898" opacity="0.76" filter="url(#wc-blur)" />
      <path d="M 84,104 Q 82,86 90,70 Q 94,60 100,56 Q 106,60 110,70 Q 118,86 116,104 Q 108,97 100,95 Q 92,97 84,104 Z" fill="#A8C8E8" opacity="0.80" filter="url(#wc-blur)" />
      <path d="M 92,76 Q 93,60 100,48 Q 107,60 108,76 Q 104,70 100,68 Q 96,70 92,76 Z" fill="#D4788E" opacity="0.78" filter="url(#wc-blur)" />
    </svg>
  );
}

// ─── Glitter layers ───────────────────────────────────────────────────────────

interface GlitterProps {
  isChocolate: boolean;
  frostingColors: number; // 3, 4, or 5
  glitter: "rainbow" | "gold" | "silver";
  size?: number;
}

function getFrostingComp(n: number, isChocolate: boolean, size: number) {
  if (n === 3) return <ThreeColorFrosting isChocolate={isChocolate} size={size} />;
  if (n === 4) return <FourColorFrosting isChocolate={isChocolate} size={size} />;
  return <FiveColorFrosting isChocolate={isChocolate} size={size} />;
}

const RAINBOW_DOTS: [number, number, string][] = [
  [72, 108, "#FF8080"], [85, 92, "#FFB060"], [100, 80, "#FFE060"],
  [115, 90, "#80D880"], [128, 104, "#80B8FF"], [92, 76, "#C080FF"],
  [108, 74, "#FF80C0"], [78, 120, "#80FFCC"], [122, 118, "#FFA080"],
  [100, 62, "#C8A0FF"], [68, 128, "#80E8FF"], [132, 126, "#FFD080"],
];
const GOLD_DOTS: [number, number, string][] = [
  [72, 108, "#FFD700"], [85, 92, "#FFC800"], [100, 80, "#FFE040"],
  [115, 90, "#FFD020"], [128, 104, "#FFC840"], [92, 76, "#FFE860"],
  [108, 74, "#FFD040"], [78, 120, "#FFC020"], [122, 118, "#FFE000"],
  [100, 62, "#FFD860"],
];
const SILVER_DOTS: [number, number, string][] = [
  [72, 108, "#E0E8F0"], [85, 92, "#D0D8E4"], [100, 80, "#E8EEF4"],
  [115, 90, "#D8E0EC"], [128, 104, "#E0E8F2"], [92, 76, "#CCD4E0"],
  [108, 74, "#E4ECF4"], [78, 120, "#D4DCE8"], [122, 118, "#DCE4F0"],
];

export function GlitterCupcake({ isChocolate, frostingColors, glitter, size = 200 }: GlitterProps) {
  const dots = glitter === "rainbow" ? RAINBOW_DOTS : glitter === "gold" ? GOLD_DOTS : SILVER_DOTS;
  const liner = isChocolate
    ? { color: "#EED8C0", stripe: "#D8C0A0" }
    : { color: "#F5EDD8", stripe: "#E8D8B8" };

  return (
    <svg viewBox="0 0 200 240" width={size} height={size * (240/200)} xmlns="http://www.w3.org/2000/svg" aria-label={`${glitter} glitter cupcake`}>
      <PaperLiner {...liner} />
      <CakeBase isChocolate={isChocolate} />

      {/* Same frosting layers depending on frostingColors */}
      {frostingColors >= 3 && <>
        <path d="M 36,140 Q 28,106 44,78 Q 62,52 100,48 Q 138,52 156,78 Q 172,106 164,140 Q 138,122 100,119 Q 62,122 36,140 Z" fill="#C4AED8" opacity="0.80" filter="url(#wc-blur)" />
        <path d="M 60,124 Q 56,100 68,76 Q 80,56 100,52 Q 120,56 132,76 Q 144,100 140,124 Q 120,111 100,109 Q 80,111 60,124 Z" fill="#F2C9A8" opacity="0.76" filter="url(#wc-blur)" />
        <path d="M 84,104 Q 82,86 90,70 Q 94,60 100,56 Q 106,60 110,70 Q 118,86 116,104 Q 108,97 100,95 Q 92,97 84,104 Z" fill="#A8C8A8" opacity="0.76" filter="url(#wc-blur)" />
      </>}
      {frostingColors >= 4 && <path d="M 72,114 Q 70,94 80,74 Q 88,58 100,54 Q 112,58 120,74 Q 130,94 128,114 Q 113,104 100,102 Q 87,104 72,114 Z" fill="#F0D898" opacity="0.76" filter="url(#wc-blur)" />}
      {frostingColors >= 5 && <path d="M 48,132 Q 42,104 56,78 Q 72,55 100,51 Q 128,55 144,78 Q 158,104 152,132 Q 128,117 100,114 Q 72,117 48,132 Z" fill="#E8A0B0" opacity="0.78" filter="url(#wc-blur)" />}

      {/* Peak */}
      <path d="M 92,76 Q 93,60 100,48 Q 107,60 108,76 Q 104,70 100,68 Q 96,70 92,76 Z" fill="#D4788E" opacity="0.76" filter="url(#wc-blur)" />

      {/* Glitter dots */}
      {dots.map(([cx, cy, col], i) => (
        <circle
          key={i}
          cx={cx + (i % 4 - 2) * 1.5}
          cy={cy + (i % 3 - 1) * 1.5}
          r={1.8 + (i % 3) * 0.5}
          fill={col}
          opacity={0.7 + (i % 3) * 0.1}
        />
      ))}

      {/* Shimmer overlay */}
      <ellipse
        cx="100" cy="96" rx="50" ry="48"
        fill={glitter === "gold" ? "#FFD700" : glitter === "silver" ? "#E0E8F4" : "#FFFFFF"}
        opacity="0.08"
        filter="url(#wc-shimmer)"
      />
    </svg>
  );
}

// ─── Topper illustrations ─────────────────────────────────────────────────────

export type TopperType = "unicorn" | "safari" | "cats-dogs" | "dinosaurs" | "fairies" | "butterflies";

interface TopperCupcakeProps {
  isChocolate: boolean;
  frostingColors: number;
  glitter: "rainbow" | "gold" | "silver" | "";
  topper: TopperType | "";
  size?: number;
}

function UnicornTopper({ scale = 1 }: { scale?: number }) {
  return (
    <g transform={`translate(62, -20) scale(${scale})`}>
      <path d="M 40,50 Q 38,28 40,8 Q 42,28 44,50 Z" fill="#F0D898" opacity="0.92" />
      <path d="M 39.5,46 L 38,30 M 40.5,42 L 42,26" stroke="#E0C060" strokeWidth="0.8" opacity="0.5" />
      <ellipse cx="40" cy="60" rx="18" ry="15" fill="#FAECD8" opacity="0.95" />
      <path d="M 54,52 Q 62,58 60,74" stroke="#E8A0B0" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M 50,50 Q 60,54 60,68" stroke="#C4AED8" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.75" />
      <path d="M 56,56 Q 64,60 62,72" stroke="#A8C8E8" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.65" />
      <circle cx="36" cy="58" r="3.5" fill="#3D2B1F" opacity="0.7" />
      <circle cx="35" cy="57" r="1.2" fill="#FFF" opacity="0.85" />
      <ellipse cx="28" cy="65" rx="3" ry="2" fill="#E8A0B0" opacity="0.5" />
    </g>
  );
}

function SafariTopper({ scale = 1 }: { scale?: number }) {
  return (
    <g transform={`translate(60, -22) scale(${scale})`}>
      {/* Giraffe head */}
      <ellipse cx="28" cy="52" rx="12" ry="13" fill="#F0D070" opacity="0.9" />
      <path d="M 28,39 L 26,22 M 28,39 L 30,22" stroke="#F0D070" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
      <ellipse cx="25" cy="22" rx="5" ry="4" fill="#F0D070" opacity="0.9" />
      <ellipse cx="31" cy="22" rx="5" ry="4" fill="#F0D070" opacity="0.9" />
      {/* Giraffe spots */}
      {[[26,46],[32,50],[24,56],[30,60]].map(([x,y],i) => (
        <ellipse key={i} cx={x} cy={y} rx="3.5" ry="2.5" fill="#C08030" opacity="0.5" />
      ))}
      <circle cx="24" cy="58" r="2" fill="#3D2B1F" opacity="0.6" />
      <circle cx="23" cy="57" r="0.8" fill="#FFF" opacity="0.8" />
      {/* Lion */}
      <ellipse cx="58" cy="56" rx="11" ry="10" fill="#E8C070" opacity="0.88" />
      <ellipse cx="58" cy="56" rx="15" ry="14" fill="#D4A040" opacity="0.3" />
      <circle cx="55" cy="54" r="2" fill="#3D2B1F" opacity="0.65" />
      <circle cx="54" cy="53" r="0.8" fill="#FFF" opacity="0.8" />
      <ellipse cx="58" cy="60" rx="4" ry="3" fill="#E09080" opacity="0.5" />
    </g>
  );
}

function CatsDogsTopper({ scale = 1 }: { scale?: number }) {
  return (
    <g transform={`translate(58, -20) scale(${scale})`}>
      {/* Cat */}
      <ellipse cx="26" cy="55" rx="13" ry="12" fill="#D8C8B8" opacity="0.9" />
      <path d="M 18,45 L 14,32 L 22,42 Z" fill="#D8C8B8" opacity="0.9" />
      <path d="M 34,45 L 38,32 L 30,42 Z" fill="#D8C8B8" opacity="0.9" />
      <circle cx="23" cy="53" r="2.5" fill="#3D2B1F" opacity="0.65" />
      <circle cx="22" cy="52" r="1" fill="#FFF" opacity="0.85" />
      <path d="M 24,60 Q 26,58 28,60" stroke="#3D2B1F" strokeWidth="1" fill="none" opacity="0.5" />
      {/* Whiskers */}
      {[[14,57,22,57],[14,60,22,60],[30,57,38,57],[30,60,38,60]].map(([x1,y1,x2,y2],i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3D2B1F" strokeWidth="0.8" opacity="0.3" />
      ))}
      {/* Dog */}
      <ellipse cx="58" cy="56" rx="13" ry="12" fill="#C8A878" opacity="0.9" />
      <ellipse cx="50" cy="46" rx="7" ry="10" fill="#C8A878" opacity="0.9" />
      <ellipse cx="66" cy="46" rx="7" ry="10" fill="#C8A878" opacity="0.9" />
      <circle cx="55" cy="54" r="2.5" fill="#3D2B1F" opacity="0.65" />
      <circle cx="54" cy="53" r="1" fill="#FFF" opacity="0.85" />
      <ellipse cx="58" cy="62" rx="5" ry="3.5" fill="#D08880" opacity="0.55" />
    </g>
  );
}

function DinosaursTopper({ scale = 1 }: { scale?: number }) {
  return (
    <g transform={`translate(58, -25) scale(${scale})`}>
      {/* T-Rex style head */}
      <path d="M 25,70 Q 20,60 22,45 Q 28,32 42,30 Q 56,30 62,42 Q 66,52 60,62 Q 55,68 48,72 Z" fill="#88C870" opacity="0.88" />
      {/* Scales bumps on top */}
      {[28, 34, 40, 46, 52, 58].map((x, i) => (
        <ellipse key={i} cx={x} cy={32 + (i % 2) * 3} rx="4" ry="3" fill="#60A850" opacity="0.6" />
      ))}
      {/* Eye */}
      <circle cx="38" cy="48" r="4" fill="#3D2B1F" opacity="0.75" />
      <circle cx="37" cy="47" r="1.5" fill="#FFF" opacity="0.85" />
      <circle cx="36.5" cy="46.5" r="0.6" fill="#3D2B1F" opacity="0.4" />
      {/* Mouth / teeth */}
      <path d="M 25,64 Q 35,72 48,70" stroke="#3D2B1F" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
      {[28,33,38,43].map((x,i) => (
        <path key={i} d={`M ${x},65 L ${x+1.5},70 L ${x+3},65`} fill="#FFF" opacity="0.6" />
      ))}
    </g>
  );
}

function FairiesTopper({ scale = 1 }: { scale?: number }) {
  return (
    <g transform={`translate(55, -25) scale(${scale})`}>
      {/* Wing left */}
      <ellipse cx="26" cy="45" rx="18" ry="10" fill="#C4AED8" opacity="0.45" transform="rotate(-25 26 45)" />
      <ellipse cx="22" cy="58" rx="12" ry="7" fill="#A8C8E8" opacity="0.40" transform="rotate(-15 22 58)" />
      {/* Wing right */}
      <ellipse cx="54" cy="45" rx="18" ry="10" fill="#C4AED8" opacity="0.45" transform="rotate(25 54 45)" />
      <ellipse cx="58" cy="58" rx="12" ry="7" fill="#E8A0B0" opacity="0.40" transform="rotate(15 58 58)" />
      {/* Body */}
      <ellipse cx="40" cy="55" rx="9" ry="12" fill="#FAECD8" opacity="0.92" />
      {/* Head */}
      <circle cx="40" cy="40" r="11" fill="#FAECD8" opacity="0.95" />
      {/* Hair */}
      <path d="M 30,35 Q 28,22 34,18 Q 40,16 46,18 Q 52,22 50,35" fill="#F0D070" opacity="0.7" />
      {/* Face */}
      <circle cx="37" cy="40" r="2" fill="#3D2B1F" opacity="0.6" />
      <circle cx="43" cy="40" r="2" fill="#3D2B1F" opacity="0.6" />
      <path d="M 37,46 Q 40,49 43,46" stroke="#D4788E" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.7" />
      {/* Wand */}
      <line x1="49" y1="52" x2="64" y2="30" stroke="#F0D070" strokeWidth="1.5" opacity="0.75" />
      <path d="M 64,30 L 60,28 L 64,26 L 68,28 Z" fill="#F0D070" opacity="0.85" />
      {/* Sparkles from wand */}
      {[[68,22],[72,30],[60,20]].map(([x,y],i) => (
        <path key={i} d={`M${x},${y} L${x+1},${y-3} L${x+2},${y} L${x+1},${y+3} Z`} fill="#FFD700" opacity="0.7" />
      ))}
    </g>
  );
}

function ButterfliesTopperSvg({ scale = 1 }: { scale?: number }) {
  return (
    <g transform={`translate(52, -28) scale(${scale})`}>
      {/* Large butterfly center */}
      <ellipse cx="40" cy="38" rx="18" ry="12" fill="#E8A0B0" opacity="0.55" transform="rotate(-20 40 38)" />
      <ellipse cx="40" cy="52" rx="12" ry="8" fill="#C4AED8" opacity="0.50" transform="rotate(-15 40 52)" />
      <ellipse cx="40" cy="38" rx="18" ry="12" fill="#F0D898" opacity="0.50" transform="rotate(20 40 38) scale(-1 1) translate(-80 0)" />
      <ellipse cx="40" cy="52" rx="12" ry="8" fill="#A8C8E8" opacity="0.48" transform="rotate(15 40 52) scale(-1 1) translate(-80 0)" />
      {/* Body */}
      <ellipse cx="40" cy="44" rx="3" ry="10" fill="#3D2B1F" opacity="0.55" />
      {/* Antennae */}
      <line x1="38" y1="34" x2="30" y2="22" stroke="#3D2B1F" strokeWidth="1" opacity="0.5" />
      <line x1="42" y1="34" x2="50" y2="22" stroke="#3D2B1F" strokeWidth="1" opacity="0.5" />
      <circle cx="30" cy="22" r="2" fill="#E8A0B0" opacity="0.7" />
      <circle cx="50" cy="22" r="2" fill="#C4AED8" opacity="0.7" />
      {/* Small side butterflies */}
      <ellipse cx="14" cy="30" rx="10" ry="7" fill="#A8C8A8" opacity="0.45" transform="rotate(-30 14 30)" />
      <ellipse cx="66" cy="30" rx="10" ry="7" fill="#F2C9A8" opacity="0.45" transform="rotate(30 66 30)" />
    </g>
  );
}

// Full composite cupcake with all layers visible in preview
export function LivePreviewCupcake({ isChocolate, frostingColors, glitter, topper, size = 240 }: TopperCupcakeProps) {
  const liner = isChocolate
    ? { color: "#EED8C0", stripe: "#D8C0A0" }
    : { color: "#F5EDD8", stripe: "#E8D8B8" };

  const glitterDots =
    glitter === "rainbow" ? RAINBOW_DOTS
    : glitter === "gold" ? GOLD_DOTS
    : glitter === "silver" ? SILVER_DOTS
    : [];

  const frostingColors3 = [
    { d: "M 36,140 Q 28,106 44,78 Q 62,52 100,48 Q 138,52 156,78 Q 172,106 164,140 Q 138,122 100,119 Q 62,122 36,140 Z", fill: "#C4AED8" },
    { d: "M 60,124 Q 56,100 68,76 Q 80,56 100,52 Q 120,56 132,76 Q 144,100 140,124 Q 120,111 100,109 Q 80,111 60,124 Z", fill: "#F2C9A8" },
    { d: "M 84,104 Q 82,86 90,70 Q 94,60 100,56 Q 106,60 110,70 Q 118,86 116,104 Q 108,97 100,95 Q 92,97 84,104 Z", fill: "#A8C8A8" },
  ];
  const extraFrosting4 = { d: "M 72,114 Q 70,94 80,74 Q 88,58 100,54 Q 112,58 120,74 Q 130,94 128,114 Q 113,104 100,102 Q 87,104 72,114 Z", fill: "#F0D898" };
  const extraFrosting5 = { d: "M 48,132 Q 42,104 56,78 Q 72,55 100,51 Q 128,55 144,78 Q 158,104 152,132 Q 128,117 100,114 Q 72,117 48,132 Z", fill: "#E8A0B0" };

  const showFrosting = frostingColors > 0;

  return (
    <svg viewBox="0 0 200 260" width={size} height={size * (260/200)} xmlns="http://www.w3.org/2000/svg" aria-label="Live cupcake preview">
      {/* Topper (rendered behind frosting so it appears to sit on top via z-ordering in SVG) */}
      {topper === "unicorn" && <UnicornTopper scale={0.9} />}
      {topper === "safari" && <SafariTopper scale={0.9} />}
      {topper === "cats-dogs" && <CatsDogsTopper scale={0.9} />}
      {topper === "dinosaurs" && <DinosaursTopper scale={0.9} />}
      {topper === "fairies" && <FairiesTopperSvg scale={0.9} />}
      {topper === "butterflies" && <ButterfliesTopperSvg scale={0.9} />}

      <PaperLiner {...liner} />
      <CakeBase isChocolate={isChocolate} />

      {showFrosting && frostingColors3.map((f, i) => (
        <path key={i} d={f.d} fill={f.fill} opacity={0.80 - i * 0.02} filter="url(#wc-blur)" />
      ))}
      {showFrosting && frostingColors >= 4 && (
        <path d={extraFrosting4.d} fill={extraFrosting4.fill} opacity={0.76} filter="url(#wc-blur)" />
      )}
      {showFrosting && frostingColors >= 5 && (
        <path d={extraFrosting5.d} fill={extraFrosting5.fill} opacity={0.78} filter="url(#wc-blur)" />
      )}
      {showFrosting && (
        <path d="M 92,76 Q 93,60 100,48 Q 107,60 108,76 Q 104,70 100,68 Q 96,70 92,76 Z" fill="#D4788E" opacity="0.76" filter="url(#wc-blur)" />
      )}

      {glitterDots.map(([cx, cy, col], i) => (
        <circle key={i} cx={cx} cy={cy} r={1.8 + (i % 3) * 0.4} fill={col} opacity={0.7 + (i % 3) * 0.1} />
      ))}
    </svg>
  );
}

// Named alias to avoid JSX conflict
function FairiesTopperSvg({ scale = 1 }: { scale?: number }) {
  return <FairiesTopper scale={scale} />;
}

// ─── Glitter swatch cards ─────────────────────────────────────────────────────

export function RainbowSwatch({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} xmlns="http://www.w3.org/2000/svg" aria-label="Rainbow glitter">
      {["#FF8080","#FFB060","#FFE060","#80D880","#80B8FF","#C080FF"].map((col, i) => (
        <ellipse key={i} cx={40} cy={40} rx={36 - i*2} ry={36 - i*2}
          fill="none" stroke={col} strokeWidth="4" opacity="0.65" filter="url(#wc-blur)" />
      ))}
      {([[20,30,"#FF8080"],[55,25,"#FFE060"],[65,50,"#80B8FF"],[30,60,"#C080FF"],[50,55,"#80D880"]] as [number,number,string][]).map(([cx,cy,c],i) => (
        <circle key={i} cx={cx} cy={cy} r="3" fill={c} opacity="0.7" />
      ))}
    </svg>
  );
}

export function GoldSwatch({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} xmlns="http://www.w3.org/2000/svg" aria-label="Gold glitter">
      <ellipse cx="40" cy="40" rx="35" ry="35" fill="#F0D070" opacity="0.35" filter="url(#wc-blur)" />
      <ellipse cx="40" cy="40" rx="25" ry="25" fill="#FFD700" opacity="0.4" filter="url(#wc-blur)" />
      {[[18,25],[55,20],[65,52],[25,58],[50,58],[38,18],[62,38]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r={2.5 + (i%3)*0.5} fill="#FFD700" opacity={0.7 + (i%3)*0.1} />
      ))}
    </svg>
  );
}

export function SilverSwatch({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} xmlns="http://www.w3.org/2000/svg" aria-label="Silver glitter">
      <ellipse cx="40" cy="40" rx="35" ry="35" fill="#C8D8E8" opacity="0.35" filter="url(#wc-blur)" />
      <ellipse cx="40" cy="40" rx="25" ry="25" fill="#E0E8F4" opacity="0.5" filter="url(#wc-blur)" />
      {[[18,25],[55,20],[65,52],[25,58],[50,58],[38,18],[62,38]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r={2.5 + (i%3)*0.5} fill="#D0DCE8" opacity={0.75 + (i%3)*0.1} />
      ))}
    </svg>
  );
}
