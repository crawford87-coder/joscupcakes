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
        <p className="font-im-fell-sc text-rose-light text-sm tracking-[0.2em] uppercase mb-4">
          — the baker —
        </p>
        <h1 className="font-cormorant italic text-berry text-5xl md:text-6xl font-medium mb-10">
          About
        </h1>
      </div>

      <div className="card space-y-6">
        <p className="font-im-fell italic text-plum text-lg md:text-xl leading-relaxed">
          Hi, I&apos;m Jo, cupcake baker, birthday magic maker, and the person
          who will absolutely take your kid&apos;s very specific idea and turn
          it into something real.
        </p>
        <p className="font-im-fell italic text-plum text-lg md:text-xl leading-relaxed">
          I bake custom cupcakes from my home kitchen in Austin for kids&apos;
          birthdays, the kind where a princess rainbow kitten or roaring
          dinosaur isn&apos;t too much to ask.
        </p>
        <p className="font-im-fell italic text-plum text-lg md:text-xl leading-relaxed">
          It all started with my niece&apos;s birthday cupcakes. By the end of
          the party, I had a line of parents asking for their turn. I said yes
          and kept saying yes.
        </p>
        <p className="font-im-fell italic text-plum text-lg md:text-xl leading-relaxed">
          I keep things small on purpose. Classic flavors like vanilla or
          chocolate, custom colors, fun toppers, and everything made fresh to
          order. My mom made birthdays feel like a big deal growing up. This is
          my way of passing that feeling on.
        </p>
        <p className="font-im-fell italic text-plum text-lg md:text-xl leading-relaxed">
          Got an idea? I want to hear it.
        </p>
        <p className="font-cormorant italic text-berry text-2xl font-medium pt-2">
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
