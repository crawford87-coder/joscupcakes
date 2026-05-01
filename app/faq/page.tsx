import Link from "next/link";

export const metadata = {
  title: "FAQ — Jo's Cupcakes",
  description:
    "Pricing, lead times, allergens, delivery info, and everything else about ordering from Jo's Cupcakes.",
};

const faqs = [
  {
    q: "How far ahead do I need to order?",
    a: "For 6 to 18 cupcakes, I need about 72 hours. For 24, 36, or 48, a full week is best. Earlier is always safer, especially for weekends.",
  },
  {
    q: "Do you deliver?",
    a: "Yes. I deliver anywhere in Austin for a flat $10. Pickup is always free.",
  },
  {
    q: "Where is pickup?",
    a: "I'll send you the address when I confirm your order.",
  },
  {
    q: "How do I pay?",
    a: "I'll send a secure payment link with your order confirmation. Orders under $80 are paid in full to book. Orders over $80 require a 50% deposit to book, with the remaining balance due 24 hours before pickup or delivery.",
  },
  {
    q: "Can I cancel or change my order?",
    a: "Yes, up to 48 hours before pickup. After that, it depends on what's already been bought or baked.",
  },
  {
    q: "What about allergies?",
    a: "My kitchen uses wheat, dairy, and eggs, and it is not nut-free. Always include allergy details in your order notes. I'll let you know what's possible before I confirm anything.",
  },
  {
    q: "Are the cake toppers edible?",
    a: "Most toppers are printed cardstock on food-safe sticks, so not edible. Sprinkles and glitter are food-grade. If you need everything edible, just tell me and I'll confirm what I can do.",
  },
  {
    q: "How does topper pricing work?",
    a: "You can choose to keep your cupcakes simple or add a themed topper. Paper toppers are $0.50 per cupcake, and toy toppers are $1.50 per cupcake. This is all reflected in your total as you build your order.",
  },
  {
    q: "What if I want something more custom?",
    a: "If your request goes beyond my standard designs or requires special materials, I may adjust the price slightly. I'll always confirm any changes with you before your order is booked, so there are no surprises.",
  },
  {
    q: "Can I order more than 48 cupcakes?",
    a: "Yes, with enough notice. Email me at jo@jocrawford.me and we'll figure it out together before anything is booked.",
  },
  {
    q: "Do you offer flavors besides vanilla and chocolate?",
    a: "Not right now. Keeping it simple helps me focus on making them look great. If you're unsure about anything, just ask. I'll always confirm the details before I start baking.",
  },
];

export default function FaqPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 pb-16 pt-12">
      <p className="font-eb-garamond text-sm tracking-wide opacity-50 mb-4" style={{ color: "#7A4A6E" }}>
        — good questions —
      </p>
      <h1 className="font-eb-garamond italic font-medium leading-tight mb-10" style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", color: "#4A2545" }}>
        The fine print{" "}
        <span style={{ color: "#7A4A6E" }}>(we&apos;ll keep it short)</span>
      </h1>

      <div className="space-y-4">
        {faqs.map(({ q, a }, i) => (
          <div key={i} className="rounded-2xl p-6" style={{ backgroundColor: "#FAF7F2", border: "1.5px solid #E8DDD4" }}>
            <h2 className="font-eb-garamond italic font-medium text-xl mb-2" style={{ color: "#4A2545" }}>
              {q}
            </h2>
            <p className="font-eb-garamond leading-relaxed" style={{ color: "#7A4A6E" }}>{a}</p>
          </div>
        ))}
      </div>

      <div className="my-12 flex items-center gap-4">
        <div className="flex-1 h-px" style={{ backgroundColor: "#E8DDD4" }} />
        <span className="font-eb-garamond text-xl" style={{ color: "#D4A870" }}>✦</span>
        <div className="flex-1 h-px" style={{ backgroundColor: "#E8DDD4" }} />
      </div>

      <p className="font-eb-garamond text-center text-lg mb-8" style={{ color: "#7A4A6E" }}>
        Still unsure about something? Ask me. I&apos;ll walk you through it.
      </p>

      <div className="text-center">
        <Link href="/order" className="btn-primary">
          ✦ Start your order
        </Link>
      </div>
    </div>
  );
}

