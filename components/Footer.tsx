export default function Footer() {
  return (
    <footer
      className="w-full py-12 mt-0"
      style={{ backgroundColor: "#F5F0E8", borderTop: "1px solid #E8DDD4" }}
    >
      <div className="max-w-5xl mx-auto px-6 flex flex-col items-center gap-4 text-center">
        <p className="font-caveat text-2xl" style={{ color: "#3D2B1F" }}>
          ✦ Jo&apos;s Cupcakes
        </p>
        <p className="font-im-fell italic text-sm opacity-60" style={{ color: "#6B5C52" }}>
          Custom cupcakes for Austin&apos;s wildest birthday wishes ·{" "}
          <a
            href="mailto:jo@joscupcakes.com"
            className="underline transition-opacity hover:opacity-100"
            style={{ color: "#D4788E" }}
          >
            jo@joscupcakes.com
          </a>
        </p>
        <p className="font-caveat text-xs opacity-30" style={{ color: "#6B5C52" }}>
          Austin, TX · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}

