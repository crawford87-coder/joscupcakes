// Inline SVG decorative elements for the storybook theme

export function Sparkle({
  className = "",
  size = 16,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 4-point star */}
      <path
        d="M8 0 L9 7 L16 8 L9 9 L8 16 L7 9 L0 8 L7 7 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Butterfly({
  className = "",
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Left wings */}
      <ellipse cx="13" cy="10" rx="12" ry="8" fill="currentColor" opacity="0.35" />
      <ellipse cx="11" cy="22" rx="9" ry="6" fill="currentColor" opacity="0.25" />
      {/* Right wings */}
      <ellipse cx="35" cy="10" rx="12" ry="8" fill="currentColor" opacity="0.35" />
      <ellipse cx="37" cy="22" rx="9" ry="6" fill="currentColor" opacity="0.25" />
      {/* Body */}
      <ellipse cx="24" cy="16" rx="2" ry="8" fill="currentColor" opacity="0.6" />
      {/* Antennae */}
      <line x1="22" y1="8" x2="17" y2="2" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <line x1="26" y1="8" x2="31" y2="2" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <circle cx="17" cy="2" r="1.5" fill="currentColor" opacity="0.5" />
      <circle cx="31" cy="2" r="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

// Section corner sparkle cluster
export function SparkleCorner({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <Sparkle size={10} className="text-pink-soft absolute top-0 left-0 opacity-70" />
      <Sparkle size={7} className="text-lavender absolute top-4 left-5 opacity-50" />
      <Sparkle size={5} className="text-rose-light absolute top-1 left-8 opacity-40" />
    </div>
  );
}

// Dashed divider with centered sparkle
export function Divider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 my-10 text-border-pink ${className}`}>
      <div className="flex-1 border-t-2 border-dashed border-border-pink" />
      <span className="text-rose-light text-lg leading-none">✦</span>
      <div className="flex-1 border-t-2 border-dashed border-border-pink" />
    </div>
  );
}
