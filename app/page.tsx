import Link from "next/link";
import { Divider, Sparkle, Butterfly } from "@/components/Decorative";

const galleryPlaceholders = [
  { id: 1, alt: "Rainbow princess kitten cupcakes" },
  { id: 2, alt: "Dinosaur stomp cupcakes" },
  { id: 3, alt: "Fairy garden cupcakes" },
  { id: 4, alt: "Unicorn swirl cupcakes" },
];

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 pb-16">
      {/* ── Hero ── */}
      <section className="relative pt-12 pb-16 text-center">
        <Butterfly className="absolute top-8 left-0 text-lavender opacity-60 hidden md:block" size={56} />
        <Butterfly className="absolute top-8 right-0 text-pink-soft opacity-60 hidden md:block" size={56} />

        <p className="font-im-fell-sc text-rose-light text-sm tracking-[0.2em] uppercase mb-4">
          — made with magic in austin —
        </p>

        <h1 className="font-cormorant italic text-berry text-6xl md:text-8xl font-medium leading-tight mb-6">
          Once upon a cupcake...
        </h1>

        <p className="font-im-fell italic text-plum text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed mb-10">
          Rainbow princess kittens. Roar-roar dinosaurs. Fairy gardens, unicorn
          swirls, and toppers that look like your kid&apos;s wildest daydream.
          We bake the magic — you bring the birthday wish.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/order" className="btn-primary text-base px-10 py-4">
            ✦ Start your order
          </Link>
          <a href="#gallery" className="btn-secondary text-base px-10 py-4">
            See the magic
          </a>
        </div>
      </section>

      <Divider />

      {/* ── Gallery ── */}
      <section id="gallery" className="py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {galleryPlaceholders.map((item) => (
            <div
              key={item.id}
              className="aspect-square rounded-2xl bg-gradient-to-br from-pink-soft/40 to-lavender/30 border-2 border-dashed border-border-pink flex items-center justify-center"
            >
              <div className="text-center p-3">
                <Sparkle size={20} className="text-rose-light mx-auto mb-2" />
                <p className="font-im-fell italic text-plum/50 text-xs leading-tight">
                  {item.alt}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="font-im-fell italic text-plum/50 text-sm text-center mt-4">
          ↑ a few of our recent enchantments
        </p>
      </section>

      <Divider />

      {/* ── How it works ── */}
      <section className="py-8">
        <h2 className="font-cormorant italic text-berry text-4xl md:text-5xl font-medium text-center mb-12">
          How the magic happens
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Dream it up",
              body: "Rainbow swirl? Dinosaur stomp? Tell us your kid's wildest wish.",
            },
            {
              step: "2",
              title: "We confirm",
              body: "Jo writes back within a day with the total and pickup details.",
            },
            {
              step: "3",
              title: "Magic delivered",
              body: "Free pickup, $10 delivery anywhere in Austin ISD.",
            },
          ].map(({ step, title, body }) => (
            <div key={step} className="card text-center relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-rose flex items-center justify-center shadow-btn">
                <span className="font-im-fell-sc text-white text-sm">{step}</span>
              </div>
              <h3 className="font-cormorant italic text-berry text-2xl font-medium mt-4 mb-3">
                {title}
              </h3>
              <p className="font-im-fell italic text-plum leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── Closing CTA ── */}
      <section className="py-8 text-center">
        <h2 className="font-cormorant italic text-berry text-4xl md:text-5xl font-medium mb-4">
          What will you dream up?
        </h2>
        <p className="font-im-fell italic text-plum text-lg md:text-xl max-w-xl mx-auto mb-8 leading-relaxed">
          Order 6, 12, 18, 24 or 36. Vanilla or chocolate. Up to five icing
          colors. Toppers, glitter, sprinkles — all the trimmings.
        </p>
        <Link href="/order" className="btn-primary text-base px-10 py-4">
          ✦ Begin your order
        </Link>
      </section>
    </div>
  );
}
