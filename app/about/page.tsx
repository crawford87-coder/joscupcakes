import Link from "next/link";
import { Divider, Butterfly } from "@/components/Decorative";

export const metadata = {
  title: "About — Jo's Cupcakes",
  description:
    "Hi, I'm Jo. I bake custom cupcakes from my home kitchen in Austin for kids' birthdays.",
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 pb-16 pt-12">
      <div className="relative">
        <Butterfly className="absolute -top-4 -right-8 text-lavender opacity-40 hidden md:block" size={64} />
        <p className="font-eb-garamond text-sm tracking-wide opacity-50 mb-4" style={{ color: "#7A4A6E" }}>
          — the baker —
        </p>
        <h1 className="font-eb-garamond italic font-medium leading-tight mb-10" style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", color: "#4A2545" }}>
          About
        </h1>
      </div>

      <div className="card space-y-6">
        <p className="font-eb-garamond text-tp-primary text-lg md:text-xl leading-relaxed">
          Hi, I&apos;m Jo, cupcake baker, birthday magic maker, and the person
          who will absolutely take your kid&apos;s very specific idea and turn
          it into something real.
        </p>
        <p className="font-eb-garamond text-tp-primary text-lg md:text-xl leading-relaxed">
          I bake custom cupcakes from my home kitchen in Austin for kids&apos;
          birthdays, the kind where a princess rainbow kitten or roaring
          dinosaur isn&apos;t too much to ask.
        </p>
        <p className="font-eb-garamond text-tp-primary text-lg md:text-xl leading-relaxed">
          It all started with my niece&apos;s birthday cupcakes. By the end of
          the party, I had a line of parents asking for their turn. I said yes
          and kept saying yes.
        </p>
        <p className="font-eb-garamond text-tp-primary text-lg md:text-xl leading-relaxed">
          I keep things small on purpose. Classic flavors like vanilla or
          chocolate, custom colors, fun toppers, and everything made fresh to
          order. My mom made birthdays feel like a big deal growing up. This is
          my way of passing that feeling on.
        </p>
        <p className="font-eb-garamond text-tp-primary text-lg md:text-xl leading-relaxed">
          Got an idea? I want to hear it.
        </p>
        <p className="font-eb-garamond font-medium text-2xl pt-2" style={{ color: "#4A2545" }}>
          Jo
        </p>
      </div>

      <Divider />

      <div className="text-center">
        <Link href="/order" className="btn-primary">
          ❖ Start your order
        </Link>
      </div>
    </div>
  );
}
