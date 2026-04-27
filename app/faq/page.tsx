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
    a: "72 hours for 6–18 cupcakes. A full week for 24 or 36. The earlier the better, especially on weekends.",
  },
  {
    q: "Do you deliver?",
    a: "Yes — anywhere within Austin ISD boundaries for a flat $10. Pickup is free.",
  },
  {
    q: "Where's pickup?",
    a: "You'll get the address when Jo writes back to confirm.",
  },
  {
    q: "How do I pay?",
    a: "Venmo, Zelle, or cash at pickup or delivery. No deposit needed for orders under $80; larger orders may require a 50% deposit, which Jo will mention when confirming.",
  },
  {
    q: "Can I cancel or change my order?",
    a: "Yes, up to 48 hours before pickup. Within 48 hours, changes depend on what's already been bought or baked.",
  },
  {
    q: "What about allergies?",
    a: "The kitchen handles wheat, dairy, and eggs, and is not nut-free. Always tell Jo about allergies in the notes — she'll let you know what's possible.",
  },
  {
    q: "Are the cake toppers edible?",
    a: "Most are printed cardstock toppers on food-safe sticks (not edible). Edible glitter and sprinkles are food-grade. Tell Jo if you need everything edible (for a smash cake, etc.).",
  },
  {
    q: "Can I get more than 36?",
    a: "Email jo@joscupcakes.com — large orders are possible with extra lead time.",
  },
  {
    q: "Do you do flavors besides vanilla and chocolate?",
    a: "Not yet. Maybe later.",
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

      <div className="text-center">
        <Link href="/order" className="btn-primary">
          ✦ Start your order
        </Link>
      </div>
    </div>
  );
}
