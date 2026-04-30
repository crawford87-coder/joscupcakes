// Pricing constants used by both the form and the API route

export const PRICES: Record<number, number> = {
  6: 24,
  12: 42,
  18: 60,
  24: 76,
  36: 108,
  48: 140,
};

export const ADDON_TOPPER = 8;
export const ADDON_EXTRAS = 3; // sprinkles or glitter
export const ADDON_DELIVERY = 10;

export function calculateTotal({
  quantity,
  topper,
  hasExtras,
  delivery,
}: {
  quantity: number;
  topper: boolean;
  hasExtras: boolean;
  delivery: boolean;
}): number {
  let total = PRICES[quantity] ?? 0;
  if (topper) total += ADDON_TOPPER;
  if (hasExtras) total += ADDON_EXTRAS;
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

export const ICING_COLOR_OPTIONS = [
  { id: "white", label: "White", hex: "#FFFFFF" },
  { id: "pink", label: "Pink", hex: "#F4C0D1" },
  { id: "lavender", label: "Lavender", hex: "#C5B8E8" },
  { id: "mint", label: "Mint", hex: "#B5D9C7" },
  { id: "butter", label: "Butter", hex: "#FAC775" },
  { id: "blue", label: "Baby Blue", hex: "#A8D0E6" },
  { id: "peach", label: "Peach", hex: "#F9C6A0" },
  { id: "red", label: "Red", hex: "#E57373" },
  { id: "teal", label: "Teal", hex: "#80CBC4" },
  { id: "purple", label: "Purple", hex: "#9575CD" },
];
