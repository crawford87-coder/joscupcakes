export default function Footer() {
  return (
    <footer
      className="w-full py-12 mt-0"
      style={{ backgroundColor: "#F5F0E8", borderTop: "1px solid #E8DDD4" }}
    >
      <div className="max-w-5xl mx-auto px-6 flex flex-col items-center gap-4 text-center">
        <p className="font-caveat text-2xl" style={{ color: "#4A2545" }}>
          ✦ Jo&apos;s Cupcakes
        </p>
        <p className="font-eb-garamond italic text-sm" style={{ color: "#7A4A6E" }}>
          Custom cupcakes for Austin&apos;s wildest birthday wishes ·{" "}
          <a
            href="mailto:jo@jocrawford.me"
            className="underline transition-opacity hover:opacity-100"
            style={{ color: "#D4788E" }}
          >
            jo@jocrawford.me
          </a>
        </p>
        <p className="font-eb-garamond text-xs" style={{ color: "#7D5A7A" }}>
          Austin, TX · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}

