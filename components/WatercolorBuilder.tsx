"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  WashDivider,
  CornerSplash,
  SectionWash,
  StepPill,
  WcSelectionCard,
  StepProgress,
} from "./WatercolorUI";
import { PRICES, ADDON_TOPPER, ADDON_DELIVERY } from "@/lib/pricing";

type Flavor = "vanilla" | "chocolate" | "";
type FrostingType = "1-color" | "3-color" | "rainbow" | "";
type TopperType = "unicorn" | "safari" | "pets" | "dinosaur" | "fairy" | "custom" | "";
type Qty = 6 | 12 | 18 | 24 | 36 | 48;

interface BuildState {
  flavor: Flavor;
  frosting: FrostingType;
  frostingColorNote: string;
  topper: TopperType;
  customTopperDesc: string;
  customTopperImageUrl: string | null;
  quantity: Qty;
}

const INITIAL: BuildState = {
  flavor: "",
  frosting: "",
  frostingColorNote: "",
  topper: "",
  customTopperDesc: "",
  customTopperImageUrl: null,
  quantity: 12,
};

const STEP_COLORS = [
  { label: "Base",     color: "#F2C9A8" },
  { label: "Frosting", color: "#C4AED8" },
  { label: "Topper",   color: "#A8C8E8" },
];

const FROSTING_OPTIONS: { id: FrostingType; label: string; desc: string; img: string }[] = [
  { id: "1-color", label: "1 colour",  desc: "one dreamy swirl",              img: "/cupcakes/swirl-single.png" },
  { id: "3-color", label: "3 colours", desc: "triple swirl",                  img: "/cupcakes/swirl-triple.png" },
  { id: "rainbow", label: "Rainbow",   desc: "meringue cookie on buttercream", img: "/cupcakes/swirl-rainbow.png" },
];

const TOPPER_OPTIONS: { id: TopperType; label: string; img: string }[] = [
  { id: "unicorn",  label: "Unicorn",    img: "/cupcakes/topper-unicorn.png" },
  { id: "safari",   label: "Safari",     img: "/cupcakes/topper-safari.png" },
  { id: "pets",     label: "Pets",       img: "/cupcakes/topper-pets.png" },
  { id: "dinosaur", label: "Dinosaurs",  img: "/cupcakes/topper-dinosaur.png" },
  { id: "fairy",    label: "Fairies",    img: "/cupcakes/topper-fairy.png" },
  { id: "custom",   label: "Custom \u2726", img: "" },
];

export default function WatercolorBuilder() {
  const router = useRouter();
  const [build, setBuild] = useState<BuildState>(INITIAL);
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(null);
  const [customImageUploading, setCustomImageUploading] = useState(false);
  const [customImageError, setCustomImageError] = useState<string | null>(null);
  const customFileRef = useRef<HTMLInputElement>(null);
  // 0=hero, 1=base, 2=frosting, 3=topper
  const stepRefs = useRef<(HTMLElement | null)[]>([null, null, null, null]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    stepRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => { if (entries[0].isIntersecting) setActiveStep(i); },
        { threshold: 0.3, rootMargin: "-10% 0px -10% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollToStep = useCallback((i: number) => {
    stepRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const set = useCallback(<K extends keyof BuildState>(key: K, val: BuildState[K]) => {
    setBuild((prev) => ({ ...prev, [key]: val }));
  }, []);

  async function handleCustomImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setCustomImageError("Only image files accepted."); return; }
    if (file.size > 10 * 1024 * 1024) { setCustomImageError("Image must be under 10 MB."); return; }
    setCustomImageError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setCustomImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setCustomImageUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `topper-ref-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("reference-images").upload(fileName, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("reference-images").getPublicUrl(fileName);
      set("customTopperImageUrl", data.publicUrl);
    } catch {
      setCustomImageError("Could not upload — you can still describe it in the text box.");
    } finally {
      setCustomImageUploading(false);
    }
  }

  const completedSteps = [
    build.flavor ? 0 : -1,
    build.frosting ? 1 : -1,
    build.topper ? 2 : -1,
  ].filter((n) => n >= 0);

  const isComplete = !!(build.flavor && build.frosting && build.topper);
  const basePrice = PRICES[build.quantity] ?? 0;
  const topperPrice = build.topper ? ADDON_TOPPER : 0;
  const total = basePrice + topperPrice;
  const topperLabel = build.topper === "custom" ? "Custom topper" : TOPPER_OPTIONS.find((t) => t.id === build.topper)?.label ?? "";
  const frostingLabel = FROSTING_OPTIONS.find((f) => f.id === build.frosting)?.label ?? "";

  function handleStartOrder() {
    const params = new URLSearchParams();
    if (build.flavor) params.set("flavor", build.flavor);
    if (build.frosting) params.set("frostingType", build.frosting);
    if (build.frostingColorNote) params.set("frostingColorNote", build.frostingColorNote);
    if (build.topper) params.set("topperDesc", build.topper);
    if (build.customTopperDesc) params.set("customTopperDesc", build.customTopperDesc);
    if (build.customTopperImageUrl) params.set("customTopperImageUrl", build.customTopperImageUrl);
    params.set("qty", String(build.quantity));
    router.push(`/order?${params.toString()}`);
  }

  return (
    <div className="relative">

      {/* HERO */}
      <section
        ref={(el) => { stepRefs.current[0] = el; }}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center overflow-hidden"
        style={{ backgroundColor: "#FAF7F2" }}
      >
        <SectionWash color="#F2C9A8" />
        <CornerSplash corner="top-left" color="#C4AED8" size={220} className="absolute top-0 left-0" />
        <CornerSplash corner="top-right" color="#A8C8E8" size={180} className="absolute top-0 right-0" />
        <CornerSplash corner="bottom-right" color="#E8A0B0" size={160} className="absolute bottom-0 right-0" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="relative w-[min(480px,85vw)] aspect-[4/3] drop-shadow-xl">
              <Image src="/cupcakes/hero.png" alt="Five beautifully decorated watercolour cupcakes" fill sizes="(max-width: 768px) 85vw, 480px" className="object-contain" priority />
            </div>
          </div>
          <div className="relative mb-6">
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
              {[
                { left: "3%",  top: "-0.35em", delay: "0s"    },
                { left: "22%", top: "0.1em",   delay: "0.5s"  },
                { left: "44%", top: "-0.45em", delay: "1.0s"  },
                { left: "67%", top: "0.05em",  delay: "1.5s"  },
                { left: "88%", top: "-0.35em", delay: "2.0s"  },
              ].map((s, i) => (
                <span key={i} className="sparkle-dot" style={{ left: s.left, top: s.top, animationDelay: s.delay }}>✦</span>
              ))}
            </span>
            <h1 className="font-cormorant italic font-medium leading-tight" style={{ fontSize: "clamp(3rem, 8vw, 5rem)", color: "#7D5318" }}>
              Build your dream cupcake
            </h1>
          </div>
          <p className="font-im-fell italic text-xl leading-relaxed mb-10 opacity-70" style={{ color: "#6B5C52" }}>
            Pick your base, frosting and topper. Then we&apos;ll bake the magic.
          </p>
          <button onClick={() => scrollToStep(1)} className="btn-primary text-xl px-12 py-4">
            Start Building ↓
          </button>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="font-caveat text-sm" style={{ color: "#6B5C52" }}>scroll to build</span>
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none" className="animate-bounce">
            <path d="M8 0 L8 20 M2 14 L8 20 L14 14" stroke="#6B5C52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* MAIN BUILDER */}
      <div className="lg:flex lg:items-start">

        {/* STICKY PREVIEW */}
        <div className="lg:w-[44%] lg:sticky lg:top-0 lg:h-screen flex flex-col items-center justify-center py-8 px-4 lg:px-8 order-first">
          <div className="relative rounded-3xl p-8 flex flex-col items-center gap-6 w-full max-w-[320px] mx-auto"
            style={{ backgroundColor: "#FAF7F2", boxShadow: "0 8px 48px rgba(107,92,82,0.10)", border: "1.5px solid #E8DDD4" }}>
            <p className="font-caveat text-sm opacity-50 -mb-2" style={{ color: "#6B5C52" }}>your cupcake preview</p>
            <LivePreview build={build} />
            <div className="flex flex-wrap gap-1.5 justify-center">
              {build.flavor && <Chip color="#F2C9A8">{build.flavor}</Chip>}
              {build.frosting && <Chip color="#C4AED8">{frostingLabel}</Chip>}
              {build.topper && <Chip color="#A8C8E8">{topperLabel}</Chip>}
            </div>
            <StepProgress steps={STEP_COLORS} activeStep={Math.max(0, activeStep - 1)} completedSteps={completedSteps} onStepClick={(i) => scrollToStep(i + 1)} />
          </div>
        </div>

        {/* STEPS */}
        <div className="lg:w-[56%]">

          {/* STEP 1: BASE */}
          <section ref={(el) => { stepRefs.current[1] = el; }} className="relative min-h-screen flex items-center px-6 py-20 lg:py-32 overflow-hidden">
            <SectionWash color="#F2C9A8" />
            <div className="relative z-10 w-full max-w-xl">
              <StepPill number="01" label="Choose your base" color="#F2C9A8" />
              <h2 className="font-cormorant italic font-medium leading-tight mb-3" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#3D2B1F" }}>
                What&apos;s the cake?
              </h2>
              <p className="font-im-fell italic text-lg opacity-60 mb-10" style={{ color: "#6B5C52" }}>Every great cupcake starts here.</p>
              <div className="grid grid-cols-2 gap-5">
                {[
                  { id: "vanilla" as Flavor,   label: "Vanilla",   desc: "pale golden cake", img: "/cupcakes/base-vanilla.png" },
                  { id: "chocolate" as Flavor, label: "Chocolate", desc: "rich dark cake",    img: "/cupcakes/base-choc.png" },
                ].map(({ id, label, desc, img }) => (
                  <WcSelectionCard key={id} selected={build.flavor === id} onClick={() => { set("flavor", id); setTimeout(() => scrollToStep(2), 400); }} accentColor="#F2C9A8">
                    <div className="relative w-32 h-32 mx-auto"><Image src={img} alt={`${label} cupcake base`} fill sizes="128px" className="object-contain" /></div>
                    <p className="font-caveat text-xl mt-2" style={{ color: "#3D2B1F" }}>{label}</p>
                    <p className="font-im-fell italic text-xs opacity-50 mt-1" style={{ color: "#6B5C52" }}>{desc}</p>
                  </WcSelectionCard>
                ))}
              </div>
            </div>
          </section>

          <WashDivider color="#C4AED8" />

          {/* STEP 2: FROSTING */}
          <section ref={(el) => { stepRefs.current[2] = el; }} className="relative min-h-screen flex items-start px-6 py-20 lg:py-32 overflow-hidden">
            <SectionWash color="#C4AED8" />
            <div className="relative z-10 w-full max-w-xl">
              <StepPill number="02" label="Choose your frosting" color="#C4AED8" />
              <h2 className="font-cormorant italic font-medium leading-tight mb-3" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#3D2B1F" }}>
                Paint the frosting.
              </h2>
              <p className="font-im-fell italic text-lg opacity-60 mb-10" style={{ color: "#6B5C52" }}>How would you like your frosting?</p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {FROSTING_OPTIONS.map(({ id, label, desc, img }) => (
                  <WcSelectionCard key={id} selected={build.frosting === id} onClick={() => set("frosting", id)} accentColor="#C4AED8">
                    <div className="relative w-28 h-28 mx-auto"><Image src={img} alt={label} fill sizes="112px" className="object-contain" /></div>
                    <p className="font-caveat text-sm mt-2" style={{ color: "#3D2B1F" }}>{label}</p>
                    <p className="font-im-fell italic text-xs opacity-50 mt-0.5" style={{ color: "#6B5C52" }}>{desc}</p>
                  </WcSelectionCard>
                ))}
              </div>

              {/* Rainbow info note */}
              {build.frosting === "rainbow" && (
                <div className="rounded-2xl px-5 py-4 mb-6 flex items-start gap-3"
                  style={{ backgroundColor: "#F5F0E8", border: "1.5px solid #C4AED8" }}>
                  <span className="text-lg mt-0.5">✦</span>
                  <p className="font-im-fell italic text-sm leading-relaxed" style={{ color: "#6B5C52" }}>
                    Rainbow frosting is a meringue cookie sitting on classic buttercream — vanilla or chocolate to match your cake base. No colour choices needed!
                  </p>
                </div>
              )}

              {/* Colour note textarea for 1-color and 3-color */}
              {(build.frosting === "1-color" || build.frosting === "3-color") && (
                <div className="rounded-3xl p-6 space-y-3 mb-6" style={{ backgroundColor: "#FAF7F2", border: "1.5px solid #E8DDD4" }}>
                  <p className="font-caveat text-lg" style={{ color: "#3D2B1F" }}>
                    Tell Jo your colour wishes <span className="opacity-40 text-sm">(optional)</span>
                  </p>
                  <textarea
                    value={build.frostingColorNote}
                    onChange={(e) => set("frostingColorNote", e.target.value)}
                    placeholder={build.frosting === "1-color"
                      ? "e.g. soft lavender, hot pink, classic white..."
                      : "e.g. pink, purple and mint, or pastels to match a rainbow theme..."}
                    rows={3}
                    className="w-full rounded-xl px-4 py-3 font-im-fell italic resize-none outline-none transition-colors"
                    style={{ border: "2px solid #E8DDD4", backgroundColor: "white", color: "#3D2B1F" }}
                    onFocus={(e) => (e.target.style.borderColor = "#C4AED8")}
                    onBlur={(e) => (e.target.style.borderColor = "#E8DDD4")}
                  />
                </div>
              )}

              {build.frosting && (
                <button
                  onClick={() => setTimeout(() => scrollToStep(3), 200)}
                  className="font-caveat text-sm px-6 py-2.5 rounded-full"
                  style={{ backgroundColor: "#C4AED8", color: "#3D2B1F" }}>
                  Next ↓
                </button>
              )}
            </div>
          </section>

          <WashDivider color="#A8C8E8" />

          {/* STEP 3: TOPPER */}
          <section ref={(el) => { stepRefs.current[3] = el; }} className="relative min-h-screen flex items-start px-6 py-20 lg:py-32 overflow-hidden">
            <SectionWash color="#A8C8E8" />
            <CornerSplash corner="bottom-right" color="#E8A0B0" size={200} className="absolute bottom-0 right-0" />
            <div className="relative z-10 w-full max-w-xl">
              <StepPill number="03" label="Choose your topper" color="#A8C8E8" />
              <h2 className="font-cormorant italic font-medium leading-tight mb-3" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#3D2B1F" }}>The finishing touch.</h2>
              <p className="font-im-fell italic text-lg opacity-60 mb-10" style={{ color: "#6B5C52" }}>
                A toy or paper topper sits on top of your frosting. +${ADDON_TOPPER}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                {TOPPER_OPTIONS.map(({ id, label, img }) => (
                  <WcSelectionCard key={id} selected={build.topper === id} onClick={() => set("topper", id)} accentColor="#A8C8E8">
                    {img ? (
                      <div className="relative w-24 h-24 mx-auto mb-2"><Image src={img} alt={label} fill sizes="96px" className="object-contain" /></div>
                    ) : (
                      <div className="w-24 h-24 mx-auto mb-2 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#F5F0E8", border: "2px dashed #C4AED8" }}>
                        <span className="text-3xl">✏️</span>
                      </div>
                    )}
                    <p className="font-caveat text-base" style={{ color: "#3D2B1F" }}>{label}</p>
                  </WcSelectionCard>
                ))}
              </div>
              {build.topper === "custom" && (
                <div className="rounded-3xl p-6 space-y-5" style={{ backgroundColor: "#FAF7F2", border: "1.5px solid #E8DDD4" }}>
                  <p className="font-caveat text-lg" style={{ color: "#3D2B1F" }}>Tell Jo what you&apos;d love ✦</p>
                  <label className="block space-y-2">
                    <span className="font-caveat text-sm opacity-60" style={{ color: "#6B5C52" }}>Describe your topper</span>
                    <textarea value={build.customTopperDesc} onChange={(e) => set("customTopperDesc", e.target.value)}
                      placeholder="e.g. a little dinosaur in a birthday hat, a mermaid with purple hair..."
                      rows={3}
                      className="w-full rounded-xl px-4 py-3 font-im-fell italic resize-none outline-none transition-colors"
                      style={{ border: "2px solid #E8DDD4", backgroundColor: "white", color: "#3D2B1F" }}
                      onFocus={(e) => (e.target.style.borderColor = "#C4AED8")}
                      onBlur={(e) => (e.target.style.borderColor = "#E8DDD4")} />
                  </label>
                  <label className="block space-y-2">
                    <span className="font-caveat text-sm opacity-60" style={{ color: "#6B5C52" }}>Reference image (optional)</span>
                    {customImagePreview ? (
                      <div className="relative inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={customImagePreview} alt="Topper reference" className="max-h-36 rounded-xl object-cover" style={{ border: "2px solid #E8DDD4" }} />
                        {customImageUploading && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(250,247,242,0.8)" }}>
                            <span className="font-caveat text-sm" style={{ color: "#D4788E" }}>Uploading…</span>
                          </div>
                        )}
                        {!customImageUploading && (
                          <button type="button" onClick={() => { setCustomImagePreview(null); set("customTopperImageUrl", null); if (customFileRef.current) customFileRef.current.value = ""; }}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                            style={{ backgroundColor: "#D4788E", color: "white" }}>✕</button>
                        )}
                      </div>
                    ) : (
                      <button type="button" onClick={() => customFileRef.current?.click()}
                        className="w-full rounded-xl py-8 flex flex-col items-center gap-1.5"
                        style={{ border: "2px dashed #C4AED8", backgroundColor: "transparent" }}>
                        <span className="text-2xl opacity-50">🖼</span>
                        <span className="font-caveat text-sm" style={{ color: "#6B5C52" }}>Click to upload a reference image</span>
                        <span className="font-im-fell italic text-xs opacity-40" style={{ color: "#6B5C52" }}>JPG, PNG · up to 10 MB</span>
                      </button>
                    )}
                    <input ref={customFileRef} type="file" accept="image/*" className="hidden" onChange={handleCustomImage} />
                    {customImageError && <p className="font-im-fell italic text-sm" style={{ color: "#C0392B" }}>{customImageError}</p>}
                  </label>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* SUMMARY */}
      <section className="relative px-6 py-24 overflow-hidden" style={{ backgroundColor: "#F5F0E8" }}>
        <SectionWash color="#E8A0B0" />
        <CornerSplash corner="top-left" color="#C4AED8" size={200} className="absolute top-0 left-0" />
        <CornerSplash corner="bottom-right" color="#F0D898" size={180} className="absolute bottom-0 right-0" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-caveat text-base opacity-50 mb-2" style={{ color: "#6B5C52" }}>\u2014 almost done \u2014</p>
            <h2 className="font-cormorant italic font-medium" style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", color: "#3D2B1F" }}>Your cupcake order</h2>
          </div>
          <div className="rounded-3xl p-8 mb-8" style={{ backgroundColor: "#FAF7F2", boxShadow: "0 8px 48px rgba(107,92,82,0.10)", border: "1.5px solid #E8DDD4" }}>
            <div className="space-y-3 mb-8">
              {[
                { label: "Base",     value: build.flavor || "\u2014",            color: "#F2C9A8", done: !!build.flavor,   step: 1 },
                { label: "Frosting", value: frostingLabel || "\u2014",           color: "#C4AED8", done: !!build.frosting, step: 2 },
                { label: "Topper",   value: build.topper ? topperLabel : "\u2014", color: "#A8C8E8", done: !!build.topper, step: 3 },
              ].map(({ label, value, color, done, step }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: done ? color : "#E8DDD4" }} />
                  <span className="font-caveat text-sm opacity-50 w-16 flex-shrink-0" style={{ color: "#6B5C52" }}>{label}</span>
                  <span className="font-im-fell italic capitalize text-sm flex-1" style={{ color: done ? "#3D2B1F" : "#C0B8B0" }}>{value}</span>
                  {!done && <button onClick={() => scrollToStep(step)} className="font-caveat text-xs underline opacity-40 hover:opacity-70" style={{ color: "#6B5C52" }}>choose ↑</button>}
                </div>
              ))}
              {build.frostingColorNote && (
                <div className="flex items-start gap-3 pt-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: "#C4AED8" }} />
                  <span className="font-caveat text-sm opacity-50 w-16 flex-shrink-0" style={{ color: "#6B5C52" }}>Colours</span>
                  <span className="font-im-fell italic text-sm flex-1" style={{ color: "#3D2B1F" }}>{build.frostingColorNote}</span>
                </div>
              )}
            </div>
            <div className="border-t pt-6" style={{ borderColor: "#E8DDD4" }}>
              <p className="font-caveat text-sm opacity-60 mb-4" style={{ color: "#6B5C52" }}>How many cupcakes?</p>
              <div className="grid grid-cols-3 gap-2">
                {([6, 12, 18, 24, 36, 48] as Qty[]).map((q) => (
                  <button key={q} onClick={() => set("quantity", q)}
                    className="rounded-2xl py-3 flex flex-col items-center transition-all duration-200"
                    style={{ backgroundColor: build.quantity === q ? "#F2C9A8" : "#F5F0E8", border: build.quantity === q ? "2px solid #D4A870" : "2px solid transparent", boxShadow: build.quantity === q ? "0 4px 16px rgba(212,168,112,0.3)" : "none" }}>
                    <span className="font-cormorant italic text-2xl font-medium" style={{ color: "#3D2B1F" }}>{q}</span>
                    <span className="font-caveat text-xs opacity-60" style={{ color: "#6B5C52" }}>${PRICES[q]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t mt-6 pt-6 space-y-2" style={{ borderColor: "#E8DDD4" }}>
              <div className="flex justify-between">
                <span className="font-im-fell italic opacity-60" style={{ color: "#6B5C52" }}>{build.quantity} cupcakes</span>
                <span className="font-cormorant italic text-lg" style={{ color: "#3D2B1F" }}>${basePrice}</span>
              </div>
              {build.topper && (
                <div className="flex justify-between">
                  <span className="font-im-fell italic opacity-60" style={{ color: "#6B5C52" }}>Topper</span>
                  <span className="font-cormorant italic text-lg" style={{ color: "#3D2B1F" }}>+${ADDON_TOPPER}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-3" style={{ borderColor: "#E8DDD4" }}>
                <span className="font-caveat text-lg font-bold" style={{ color: "#3D2B1F" }}>Total</span>
                <span className="font-cormorant italic text-2xl font-medium" style={{ color: "#3D2B1F" }}>${total}</span>
              </div>
              <p className="font-im-fell italic text-xs opacity-40 text-right" style={{ color: "#6B5C52" }}>+${ADDON_DELIVERY} delivery (Austin ISD) or free pickup</p>
            </div>
          </div>
          <div className="text-center">
            {!isComplete ? (
              <div>
                <p className="font-caveat text-base opacity-50 mb-4" style={{ color: "#6B5C52" }}>Finish all steps above to continue</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    { label: "Base",     done: !!build.flavor,   step: 1 },
                    { label: "Frosting", done: !!build.frosting, step: 2 },
                    { label: "Topper",   done: !!build.topper,   step: 3 },
                  ].map(({ label, done, step }) => (
                    <button key={label} onClick={() => scrollToStep(step)}
                      className="rounded-full px-4 py-1.5 font-caveat text-sm transition-all"
                      style={{ backgroundColor: done ? "#A8C8A833" : "#E8A0B033", border: done ? "1.5px solid #A8C8A8" : "1.5px solid #E8A0B0", color: "#3D2B1F" }}>
                      {done ? "✓" : "\u2192"} {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <button onClick={handleStartOrder} disabled={submitting} className="btn-primary text-xl px-12 py-5 w-full sm:w-auto">
                  {submitting ? "Just a moment..." : "✦ Place my order →"}
                </button>
                <p className="font-im-fell italic text-sm opacity-40 mt-4" style={{ color: "#6B5C52" }}>
                  You&apos;ll fill in your contact details on the next page.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function LivePreview({ build }: { build: BuildState }) {
  const frostingImg = build.frosting ? FROSTING_OPTIONS.find((f) => f.id === build.frosting)?.img : null;
  const baseImg = build.flavor === "chocolate" ? "/cupcakes/base-choc.png" : build.flavor === "vanilla" ? "/cupcakes/base-vanilla.png" : null;
  const topperImg = build.topper && build.topper !== "custom" ? TOPPER_OPTIONS.find((t) => t.id === build.topper)?.img : null;

  if (!baseImg) {
    return (
      <div className="w-40 h-40 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#F5F0E8" }}>
        <span className="font-caveat text-sm opacity-40" style={{ color: "#6B5C52" }}>choose a base ↓</span>
      </div>
    );
  }

  return (
    <div className="relative w-40 h-48 mx-auto">
      <div className="absolute inset-x-2 bottom-0 h-28">
        <Image src={baseImg} alt="cake base" fill sizes="160px" className="object-contain object-bottom" />
      </div>
      {frostingImg && (
        <div className="absolute inset-x-0 top-8 h-28">
          <Image src={frostingImg} alt="frosting" fill sizes="160px" className="object-contain object-bottom" />
        </div>
      )}
      {topperImg && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-16">
          <Image src={topperImg} alt="topper" fill sizes="64px" className="object-contain" />
        </div>
      )}
      {build.topper === "custom" && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl">✏️</div>
      )}
    </div>
  );
}

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="font-caveat text-xs px-2.5 py-1 rounded-full capitalize"
      style={{ backgroundColor: color + "44", border: `1px solid ${color}88`, color: "#3D2B1F" }}>
      {children}
    </span>
  );
}
