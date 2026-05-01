import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Gallery — Jo's Cupcakes",
  description: "A peek at some of the custom cupcakes Jo has made for kids' birthdays in Austin.",
};

export const revalidate = 3600; // re-fetch at most once per hour

export default async function GalleryPage() {
  const supabase = createClient();
  const { data: images } = await supabase
    .from("gallery_images")
    .select("id, url, caption")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-5xl mx-auto px-6 pb-20 pt-12">
      {/* Header */}
      <div className="mb-12">
        <p className="font-eb-garamond text-sm tracking-[0.2em] uppercase mb-4 opacity-60" style={{ color: "#7A4A6E" }}>
          — the work —
        </p>
        <h1 className="font-eb-garamond italic font-medium leading-tight mb-4" style={{ fontSize: "clamp(2.5rem, 7vw, 4.5rem)", color: "#4A2545" }}>
          A few favourites
        </h1>
        <p className="font-eb-garamond italic text-lg opacity-70 max-w-xl" style={{ color: "#7A4A6E" }}>
          Every batch is made from scratch, just for your kid&apos;s big day.
        </p>
      </div>

      {/* Grid */}
      {!images || images.length === 0 ? (
        <div className="rounded-3xl py-24 text-center" style={{ backgroundColor: "#F5F0E8", border: "1.5px solid #E8DDD4" }}>
          <p className="font-eb-garamond text-xl opacity-40" style={{ color: "#7A4A6E" }}>Photos coming soon — check back after the next birthday! 🎂</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{ border: "1.5px solid #E8DDD4" }}
            >
              <div className="relative w-full" style={{ paddingBottom: "110%" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.caption ?? "Custom cupcakes by Jo"}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              {img.caption && (
                <div className="px-4 py-3" style={{ backgroundColor: "#FAF7F2" }}>
                  <p className="font-eb-garamond text-sm" style={{ color: "#7A4A6E" }}>{img.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-16 text-center">
        <p className="font-eb-garamond italic text-lg opacity-70 mb-6" style={{ color: "#7A4A6E" }}>
          Want something like this for your kid&apos;s birthday?
        </p>
        <Link href="/#build" className="btn-primary text-lg px-10 py-4">
          ✦ Build your cupcakes
        </Link>
      </div>
    </div>
  );
}
