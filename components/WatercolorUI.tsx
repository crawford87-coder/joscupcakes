/**
 * WatercolorUI.tsx
 *
 * Decorative UI elements in the watercolor style:
 * — Section wash dividers
 * — Watercolor splash accents
 * — Background texture washes
 */

// ─── Watercolor wash divider ──────────────────────────────────────────────────

export function WashDivider({
  color = "#E8A0B0",
  className = "",
}: {
  color?: string;
  className?: string;
}) {
  return (
    <div className={`relative my-20 h-16 overflow-visible pointer-events-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 1200 64"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="div-blur">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" result="displaced" />
            <feGaussianBlur in="displaced" stdDeviation="2" />
          </filter>
        </defs>
        {/* Main wash blob */}
        <path
          d="M -20,32 Q 100,8 250,28 Q 400,48 600,22 Q 800,0 950,30 Q 1100,52 1220,32"
          fill="none"
          stroke={color}
          strokeWidth="28"
          strokeLinecap="round"
          opacity="0.22"
          filter="url(#div-blur)"
        />
        {/* Thinner overlay line for crispness */}
        <path
          d="M -20,32 Q 100,12 250,30 Q 400,44 600,24 Q 800,4 950,32 Q 1100,50 1220,32"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.35"
          filter="url(#div-blur)"
        />
        {/* Drip accents */}
        <ellipse cx="300" cy="42" rx="8" ry="12" fill={color} opacity="0.15" filter="url(#div-blur)" />
        <ellipse cx="720" cy="36" rx="6" ry="10" fill={color} opacity="0.12" filter="url(#div-blur)" />
        <ellipse cx="980" cy="44" rx="5" ry="9" fill={color} opacity="0.12" filter="url(#div-blur)" />
      </svg>
    </div>
  );
}

// ─── Corner splash accent ─────────────────────────────────────────────────────

export function CornerSplash({
  corner = "top-left",
  color = "#C4AED8",
  size = 200,
  className = "",
}: {
  corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  color?: string;
  size?: number;
  className?: string;
}) {
  const transforms: Record<string, string> = {
    "top-left": "",
    "top-right": "scale(-1 1) translate(-200 0)",
    "bottom-left": "scale(1 -1) translate(0 -200)",
    "bottom-right": "scale(-1 -1) translate(-200 -200)",
  };
  const t = transforms[corner];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <filter id="splash-blur">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <g transform={t}>
        <ellipse cx="0" cy="0" rx="120" ry="80" fill={color} opacity="0.12" filter="url(#splash-blur)" />
        <ellipse cx="30" cy="40" rx="70" ry="50" fill={color} opacity="0.10" filter="url(#splash-blur)" />
        {/* Spatter dots */}
        {[[60,90],[80,60],[110,100],[50,110],[90,130],[140,80]].map(([cx,cy],i) => (
          <circle key={i} cx={cx} cy={cy} r={3 + (i % 3) * 2} fill={color} opacity={0.12 + (i % 3) * 0.04} />
        ))}
        <ellipse cx="80" cy="20" rx="20" ry="12" fill={color} opacity="0.08" />
      </g>
    </svg>
  );
}

// ─── Watercolor background section wash ──────────────────────────────────────

export function SectionWash({
  color = "#F2C9A8",
  className = "",
}: {
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="sec-blur">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" result="displaced" />
            <feGaussianBlur in="displaced" stdDeviation="8" />
          </filter>
        </defs>
        <ellipse cx="500" cy="300" rx="600" ry="350" fill={color} opacity="0.15" filter="url(#sec-blur)" />
        <ellipse cx="200" cy="150" rx="300" ry="200" fill={color} opacity="0.10" filter="url(#sec-blur)" />
        <ellipse cx="800" cy="450" rx="280" ry="180" fill={color} opacity="0.08" filter="url(#sec-blur)" />
      </svg>
    </div>
  );
}

// ─── Handwritten-style step label ─────────────────────────────────────────────

export function StepPill({
  number,
  label,
  color = "#E8A0B0",
}: {
  number: string;
  label: string;
  color?: string;
}) {
  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
      style={{ backgroundColor: color + "33", border: `1.5px solid ${color}66` }}
    >
      <span
        className="font-eb-garamond text-sm font-bold"
        style={{ color: "#4A2545" }}
      >
        {number}
      </span>
      <span
        className="font-eb-garamond text-sm"
        style={{ color: "#7A4A6E" }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Watercolor selection card ────────────────────────────────────────────────

export function WcSelectionCard({
  selected,
  onClick,
  children,
  accentColor = "#E8A0B0",
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accentColor?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-3xl p-5 text-center transition-all duration-300 bg-wc-cream ${className}`}
      style={{
        border: selected ? `2px solid ${accentColor}` : "2px solid transparent",
        boxShadow: selected
          ? `0 0 0 4px ${accentColor}33, 0 8px 32px rgba(107,92,82,0.12)`
          : "0 2px 16px rgba(107,92,82,0.08)",
        transform: selected ? "translateY(-3px) scale(1.02)" : "translateY(0) scale(1)",
        backgroundColor: selected ? accentColor + "18" : "#FAF7F2",
      }}
    >
      {selected && (
        <div
          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: accentColor }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M 2,6 L 5,9 L 10,3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      {children}
    </button>
  );
}

// ─── Watercolor progress indicator ───────────────────────────────────────────

export function StepProgress({
  steps,
  activeStep,
  completedSteps,
  onStepClick,
}: {
  steps: { label: string; color: string }[];
  activeStep: number;
  completedSteps: number[];
  onStepClick: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const isComplete = completedSteps.includes(i);
        const isActive = i === activeStep;
        return (
          <button
            key={i}
            onClick={() => onStepClick(i)}
            className="flex items-center gap-2 group"
            aria-label={`Step ${i + 1}: ${s.label}`}
          >
            <div
              className="flex items-center justify-center rounded-full transition-all duration-300 font-eb-garamond text-xs font-bold"
              style={{
                width: isActive ? 32 : 24,
                height: isActive ? 32 : 24,
                backgroundColor: isComplete || isActive ? s.color : "#E8E0D8",
                color: isComplete || isActive ? "#4A2545" : "#A688A0",
                boxShadow: isActive ? `0 0 0 4px ${s.color}44` : "none",
              }}
            >
              {isComplete ? "✓" : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div
                className="h-0.5 rounded-full transition-all duration-500"
                style={{
                  width: 20,
                  backgroundColor: isComplete ? s.color : "#E8E0D8",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
