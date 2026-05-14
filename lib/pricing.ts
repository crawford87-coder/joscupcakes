// Pricing constants used by both the form and the API route

export const PRICES_NO_TOPPER: Record<number, number> = {
  6: 24,
  12: 46,
  18: 68,
  24: 88,
  36: 126,
  48: 168,
};

export const PRICES_WITH_TOPPER: Record<number, number> = {
  6: 30,
  12: 58,
  18: 86,
  24: 112,
  36: 162,
  48: 216,
};

// Legacy alias (used by order form / API — maps to no-topper base)
export const PRICES = PRICES_NO_TOPPER;

export const ADDON_DELIVERY = 10;

/** Display price for the topper add-on (minimum order of 6 cupcakes) */
export const ADDON_TOPPER = 6;

/** Display price for sprinkles/glitter extras — currently complimentary */
export const ADDON_EXTRAS = 0;

/** Icing colour palette available in the order form */
export const ICING_COLOR_OPTIONS: { id: string; label: string; hex: string }[] = [
  { id: "white",       label: "White",       hex: "#FFFFFF" },
  { id: "blush-pink",  label: "Blush Pink",  hex: "#F9C0CB" },
  { id: "rose",        label: "Rose",        hex: "#E8758A" },
  { id: "red",         label: "Red",         hex: "#E63946" },
  { id: "coral",       label: "Coral",       hex: "#FF8070" },
  { id: "peach",       label: "Peach",       hex: "#FFBE9F" },
  { id: "orange",      label: "Orange",      hex: "#F4A261" },
  { id: "yellow",      label: "Yellow",      hex: "#FFD166" },
  { id: "mint",        label: "Mint",        hex: "#A8E6CF" },
  { id: "sage",        label: "Sage",        hex: "#8FB69C" },
  { id: "green",       label: "Green",       hex: "#57CC99" },
  { id: "sky-blue",    label: "Sky Blue",    hex: "#90CBF9" },
  { id: "blue",        label: "Blue",        hex: "#4895EF" },
  { id: "lavender",    label: "Lavender",    hex: "#C4AED8" },
  { id: "purple",      label: "Purple",      hex: "#8338EC" },
  { id: "lilac",       label: "Lilac",       hex: "#D5A6E6" },
  { id: "chocolate",   label: "Chocolate",   hex: "#8B4513" },
  { id: "gold",        label: "Gold",        hex: "#D4AF37" },
  { id: "black",       label: "Black",       hex: "#2D2D2D" },
];

export function calculateTotal({
  quantity,
  topper,
  delivery,
}: {
  quantity: number;
  topper: boolean;
  delivery: boolean;
  hasExtras?: boolean;
}): number {
  const table = topper ? PRICES_WITH_TOPPER : PRICES_NO_TOPPER;
  let total = table[quantity] ?? 0;
  if (delivery) total += ADDON_DELIVERY;
  return total;
}

// Austin ISD ZIP codes (partial list — covers the school district boundaries)
export const AUSTIN_ISD_ZIPS = new Set([
  "78701","78702","78703","78704","78705","78721","78722","78723","78724",
  "78725","78726","78727","78728","78729","78730","78731","78732","78733",
  "78734","78735","78736","78737","78738","78739","78741","78742","78745",
  "78746","78747","78748","78749","78750","78751","78752","78753","78754",
  "78756","78757","78758","78759",
]);

export function isAustinISDZip(zip: string): boolean {
  return AUSTIN_ISD_ZIPS.has(zip.trim());
}

// Minimum lead time in hours based on quantity
export function minLeadTimeHours(quantity: number): number {
  return quantity >= 24 ? 168 : 72; // 1 week : 72 hours
}

export function isPickupDateValid(date: string, quantity: number): boolean {
  const pickup = new Date(date);
  const now = new Date();
  const diffMs = pickup.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours >= minLeadTimeHours(quantity);
}

// Generate a human-readable reference number: JC-2026-XXXX
export function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `JC-${year}-${rand}`;
}


