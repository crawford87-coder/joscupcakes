import Link from "next/link";
import { Divider } from "@/components/Decorative";

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
      <p className="font-im-fell-sc text-rose-light text-sm tracking-[0.2em] uppercase mb-4">
        — good questions —
      </p>
      <h1 className="font-cormorant italic text-berry text-5xl md:text-6xl font-medium mb-10">
        The fine print{" "}
        <span className="text-rose-light">(we&apos;ll keep it short)</span>
      </h1>

      <div className="space-y-4">
        {faqs.map(({ q, a }, i) => (
          <div key={i} className="card">
            <h2 className="font-cormorant italic text-berry text-xl font-medium mb-2">
              {q}
            </h2>
            <p className="font-im-fell italic text-plum leading-relaxed">{a}</p>
          </div>
        ))}
      </div>

      <Divider />

      <p className="font-im-fell italic text-plum text-center text-lg mb-8">
        Still unsure about something? Ask me. I&apos;ll walk you through it.
      </p>

      <div className="text-center">
        <Link href="/order" className="btn-primary">
          ❖ Start your order
        </Link>
      </div>
    </div>
  );
}
