import Link from "next/link";
import { Divider, Butterfly } from "@/components/Decorative";

export const metadata = {
  title: "About — Jo's Cupcakes",
  description:
    "Hi, I'm Jo. I bake custom cupcakes out of my home kitchen in Austin for kids' birthdays.",
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 pb-16 pt-12">
      {/* Corner butterflies */}
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
          Hi, I&apos;m Jo. I bake custom cupcakes out of my home kitchen in
          Austin for kids&apos; birthdays — the kind where your child gets to
          pick something wildly specific (a princess rainbow kitten, a roaring
          dinosaur, a fairy on a mushroom) and actually get it.
        </p>

        <p className="font-im-fell italic text-plum text-lg md:text-xl leading-relaxed">
          It started when I made cupcakes for my niece&apos;s birthday and every
          parent at the party wanted to know if I&apos;d do theirs next. So here
          we are.
        </p>

        <p className="font-im-fell italic text-plum text-lg md:text-xl leading-relaxed">
          I keep things small on purpose: vanilla or chocolate, your colors,
          your toppers, made fresh to order. My mom turned every one of my
          birthdays into a whole production growing up — this is me doing a
          version of that for someone else&apos;s kid.
        </p>

        <p className="font-im-fell italic text-plum text-lg md:text-xl leading-relaxed">
          Tell me what your kid is dreaming up. I&apos;ll bake it.
        </p>

        <p className="font-cormorant italic text-berry text-2xl font-medium pt-2">
          — Jo
        </p>
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
