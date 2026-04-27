import { Sparkle } from "./Decorative";

export default function Footer() {
  return (
    <footer className="w-full py-10 mt-16 border-t-2 border-dashed border-border-pink">
      <div className="max-w-5xl mx-auto px-6 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 text-rose-light">
          <Sparkle size={10} />
          <Sparkle size={8} className="opacity-60" />
          <Sparkle size={10} />
        </div>
        <p className="font-im-fell-sc text-plum text-sm tracking-widest">
          ✦ Jo&apos;s Cupcakes ✦ Austin, TX ✦{" "}
          <a
            href="mailto:jo@joscupcakes.com"
            className="hover:text-rose transition-colors"
          >
            jo@joscupcakes.com
          </a>{" "}
          ✦
        </p>
        <p className="font-im-fell italic text-plum/50 text-xs">
          Custom cupcakes for Austin&apos;s wildest birthday wishes ·{" "}
          {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
