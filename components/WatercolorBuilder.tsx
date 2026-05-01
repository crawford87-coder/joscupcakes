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
import { PRICES_NO_TOPPER, ADDON_DELIVERY } from "@/lib/pricing";

type TopperKind = "none" | "paper" | "toy";
const TOPPER_RATE: Record<TopperKind, number> = { none: 0, paper: 0.5, toy: 1.5 };
const TOPPER_KIND_LABEL: Record<TopperKind, string> = { none: "No topper", paper: "Paper topper", toy: "Toy topper" };
const TOPPER_KIND_DESC: Record<TopperKind, string> = {
  none:  "Simple, frosting-only finish",
  paper: "Lightweight printed designs for a playful finish",
  toy:   "Keepsake toppers for an extra special touch",
};

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
  const [topperKind, setTopperKind] = useState<TopperKind>("none");
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
    (topperKind === "none" || build.topper) ? 2 : -1,
  ].filter((n) => n >= 0);

  const isComplete = !!(build.flavor && build.frosting && (topperKind === "none" || build.topper));
  const topperAddon = Math.round(TOPPER_RATE[topperKind] * build.quantity * 100) / 100;
  const basePrice = PRICES_NO_TOPPER[build.quantity] ?? 0;
  const total = basePrice + topperAddon;
  const priceForQty = (q: number) => (PRICES_NO_TOPPER[q] ?? 0) + Math.round(TOPPER_RATE[topperKind] * q * 100) / 100;
  const topperLabel = build.topper === "custom" ? "Custom topper" : TOPPER_OPTIONS.find((t) => t.id === build.topper)?.label ?? "";
  const frostingLabel = FROSTING_OPTIONS.find((f) => f.id === build.frosting)?.label ?? "";

  function handleStartOrder() {
    const params = new URLSearchParams();
    if (build.flavor) params.set("flavor", build.flavor);
    if (build.frosting) params.set("frostingType", build.frosting);
    if (build.frostingColorNote) params.set("frostingColorNote", build.frostingColorNote);
    if (build.topper) params.set("topperDesc", build.topper);
    if (topperKind !== "none") params.set("topperKind", topperKind);
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
            {/* Disney-opening sparkle burst */}
            <span aria-hidden="true" className="sparkle-field">
              {/* Cluster 1 — left side of text */}
              <span className="sp sp-xl sp-gold   sp-a1"  style={{ left:"8%",  top:"50%", animationDuration:"2.8s", animationDelay:"0s"    }} />
              <span className="sp sp-sm sp-white  sp-a5"  style={{ left:"12%", top:"40%", animationDuration:"2.2s", animationDelay:"0.3s"   }} />
              <span className="sp sp-md sp-rose   sp-a3"  style={{ left:"6%",  top:"65%", animationDuration:"2.5s", animationDelay:"0.7s"   }} />
              <span className="sp sp-lg sp-peach  sp-a8"  style={{ left:"15%", top:"55%", animationDuration:"3.0s", animationDelay:"1.1s"   }} />
              <span className="sp sp-sm sp-gold   sp-a6"  style={{ left:"10%", top:"30%", animationDuration:"1.9s", animationDelay:"0.5s"   }} />
              {/* Cluster 2 — centre */}
              <span className="sp sp-xl sp-white  sp-a2"  style={{ left:"45%", top:"45%", animationDuration:"2.6s", animationDelay:"0.2s"   }} />
              <span className="sp sp-lg sp-gold   sp-a9"  style={{ left:"50%", top:"60%", animationDuration:"3.1s", animationDelay:"0.8s"   }} />
              <span className="sp sp-md sp-lavender sp-a4" style={{ left:"42%", top:"30%", animationDuration:"2.4s", animationDelay:"1.4s"   }} />
              <span className="sp sp-sm sp-rose   sp-a11" style={{ left:"55%", top:"70%", animationDuration:"1.8s", animationDelay:"0.4s"   }} />
              <span className="sp sp-sm sp-white  sp-a7"  style={{ left:"48%", top:"20%", animationDuration:"2.0s", animationDelay:"1.8s"   }} />
              {/* Cluster 3 — right side */}
              <span className="sp sp-xl sp-gold   sp-a10" style={{ left:"82%", top:"50%", animationDuration:"2.9s", animationDelay:"0.1s"   }} />
              <span className="sp sp-lg sp-rose   sp-a2"  style={{ left:"88%", top:"35%", animationDuration:"2.3s", animationDelay:"0.6s"   }} />
              <span className="sp sp-md sp-white  sp-a12" style={{ left:"78%", top:"65%", animationDuration:"2.7s", animationDelay:"1.0s"   }} />
              <span className="sp sp-sm sp-peach  sp-a5"  style={{ left:"92%", top:"55%", animationDuration:"2.1s", animationDelay:"1.5s"   }} />
              <span className="sp sp-sm sp-gold   sp-a3"  style={{ left:"85%", top:"25%", animationDuration:"1.7s", animationDelay:"0.9s"   }} />
              {/* Accent floaters above/below text */}
              <span className="sp sp-md sp-gold   sp-a8"  style={{ left:"30%", top:"10%", animationDuration:"2.4s", animationDelay:"1.2s"   }} />
              <span className="sp sp-sm sp-lavender sp-a6" style={{ left:"65%", top:"15%", animationDuration:"2.0s", animationDelay:"0.2s"   }} />
              <span className="sp sp-lg sp-white  sp-a1"  style={{ left:"25%", top:"80%", animationDuration:"3.2s", animationDelay:"1.6s"   }} />
              <span className="sp sp-sm sp-rose   sp-a9"  style={{ left:"70%", top:"85%", animationDuration:"1.9s", animationDelay:"0.7s"   }} />
              <span className="sp sp-md sp-gold   sp-a11" style={{ left:"38%", top:"75%", animationDuration:"2.6s", animationDelay:"2.0s"   }} />
            </span>
            <h1 className="font-eb-garamond italic font-medium leading-tight" style={{ fontSize: "clamp(3rem, 8vw, 5rem)", color: "#4A2545" }}>
              Build your dream cupcake
            </h1>
          </div>
          <p className="font-eb-garamond italic text-xl leading-relaxed mb-10 opacity-70" style={{ color: "#7A4A6E" }}>
            Pick your base, frosting and topper. Then we&apos;ll bake the magic.
          </p>
          <button onClick={() => scrollToStep(1)} className="btn-primary text-xl px-12 py-4">
            Start Building ↓
          </button>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="font-eb-garamond text-sm" style={{ color: "#7A4A6E" }}>scroll to build</span>
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none" className="animate-bounce">
            <path d="M8 0 L8 20 M2 14 L8 20 L14 14" stroke="#7A4A6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* MAIN BUILDER */}
      <div className="relative">

        {/* STICKY PREVIEW */}
        <div className="hidden lg:block sticky top-0 z-20" style={{ height: 0 }}>
          <div className="rounded-3xl p-8 flex flex-col items-center gap-6"
            style={{ position: "absolute", top: "50vh", left: "23%", width: "clamp(240px, 38vw, 320px)", transform: "translate(-50%, -50%)", backgroundColor: "#FAF7F2", boxShadow: "0 8px 48px rgba(107,92,82,0.10)", border: "1.5px solid #E8DDD4" }}>

            {/* Orbiting sparkle ring 1 — clockwise */}
            <span aria-hidden="true" className="orbit-ring pointer-events-none absolute" style={{ inset: -24 }}>
              {[
                { top: "0%",   left: "50%",  color: "#F5C842", delay: "0s",    size: 7 },
                { top: "25%",  left: "97%",  color: "#F2A7BE", delay: "0.6s",  size: 5 },
                { top: "75%",  left: "97%",  color: "#D4AAFF", delay: "1.2s",  size: 6 },
                { top: "100%", left: "50%",  color: "#F5C842", delay: "1.8s",  size: 5 },
                { top: "75%",  left: "3%",   color: "#F9D49A", delay: "2.4s",  size: 7 },
                { top: "25%",  left: "3%",   color: "#F2A7BE", delay: "3.0s",  size: 5 },
              ].map((d, i) => (
                <span key={i} className="orbit-dot absolute" style={{
                  top: d.top, left: d.left,
                  width: d.size, height: d.size,
                  backgroundColor: d.color,
                  boxShadow: `0 0 6px 2px ${d.color}99`,
                  animationDelay: d.delay,
                  transform: "translate(-50%, -50%)",
                }} />
              ))}
            </span>

            {/* Orbiting sparkle ring 2 — counter-clockwise, offset */}
            <span aria-hidden="true" className="orbit-ring orbit-ring-rev pointer-events-none absolute" style={{ inset: -14 }}>
              {[
                { top: "15%",  left: "92%",  color: "#FFFBF0", delay: "0.3s",  size: 5 },
                { top: "85%",  left: "92%",  color: "#F5C842", delay: "1.0s",  size: 4 },
                { top: "85%",  left: "8%",   color: "#D4AAFF", delay: "1.7s",  size: 5 },
                { top: "15%",  left: "8%",   color: "#F9D49A", delay: "2.5s",  size: 4 },
                { top: "50%",  left: "100%", color: "#F2A7BE", delay: "0.8s",  size: 6 },
                { top: "50%",  left: "0%",   color: "#F5C842", delay: "3.2s",  size: 5 },
              ].map((d, i) => (
                <span key={i} className="orbit-dot absolute" style={{
                  top: d.top, left: d.left,
                  width: d.size, height: d.size,
                  backgroundColor: d.color,
                  boxShadow: `0 0 5px 2px ${d.color}88`,
                  animationDelay: d.delay,
                  transform: "translate(-50%, -50%)",
                }} />
              ))}
            </span>

            <p className="font-eb-garamond text-sm opacity-50 -mb-2" style={{ color: "#7A4A6E" }}>your cupcake preview</p>
            <LivePreview build={build} />
            <div className="flex flex-wrap gap-1.5 justify-center">
              {build.flavor && <Chip color="#F2C9A8">{build.flavor}</Chip>}
              {build.frosting && <Chip color="#C4AED8">{frostingLabel}</Chip>}
              {build.topper && <Chip color="#A8C8E8">{topperLabel}</Chip>}
            </div>
            <StepProgress steps={STEP_COLORS} activeStep={Math.max(0, activeStep - 1)} completedSteps={completedSteps} onStepClick={(i) => scrollToStep(i + 1)} />
          </div>
        </div>

          {/* Mobile-only: sticky mini preview bar */}
          <div
            className="lg:hidden sticky top-[69px] z-30 px-4 py-3 flex items-center gap-4"
            style={{ backgroundColor: "rgba(250,247,242,0.97)", borderBottom: "1px solid #E8DDD4", backdropFilter: "blur(8px)" }}
          >
            {/* Mini cupcake */}
            <div className="flex-shrink-0 relative" style={{ width: 72, height: 84 }}>
              <MiniPreview build={build} />
            </div>
            {/* Step chips */}
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <MobileStepChip done={!!build.flavor} color="#F2C9A8" onClick={() => scrollToStep(1)}>
                {build.flavor || "Base"}
              </MobileStepChip>
              <span className="opacity-30 text-xs flex-shrink-0">›</span>
              <MobileStepChip done={!!build.frosting} color="#C4AED8" onClick={() => scrollToStep(2)}>
                {frostingLabel || "Frosting"}
              </MobileStepChip>
              <span className="opacity-30 text-xs flex-shrink-0">›</span>
              <MobileStepChip done={!!build.topper} color="#A8C8E8" onClick={() => scrollToStep(3)}>
                {topperLabel || "Topper"}
              </MobileStepChip>
            </div>
          </div>

          {/* STEP 1: BASE */}
          <section ref={(el) => { stepRefs.current[1] = el; }} className="relative min-h-screen flex items-center px-6 py-20 lg:py-32 overflow-hidden">
            <SectionWash color="#F2C9A8" />
            <div className="relative z-10 w-full max-w-xl lg:ml-[46%]">
              <StepPill number="01" label="Choose your base" color="#F2C9A8" />
              <h2 className="font-eb-garamond italic font-medium leading-tight mb-3" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#4A2545" }}>
                What&apos;s the cake?
              </h2>
              <p className="font-eb-garamond italic text-lg opacity-60 mb-10" style={{ color: "#7A4A6E" }}>Every great cupcake starts here.</p>
              <div className="grid grid-cols-2 gap-5">
                {[
                  { id: "vanilla" as Flavor,   label: "Vanilla",   desc: "pale golden cake", img: "/cupcakes/base-vanilla.png" },
                  { id: "chocolate" as Flavor, label: "Chocolate", desc: "rich dark cake",    img: "/cupcakes/base-choc.png" },
                ].map(({ id, label, desc, img }) => (
                  <WcSelectionCard key={id} selected={build.flavor === id} onClick={() => { set("flavor", id); setTimeout(() => scrollToStep(2), 400); }} accentColor="#F2C9A8">
                    <div className="relative w-32 h-32 mx-auto"><Image src={img} alt={`${label} cupcake base`} fill sizes="128px" className="object-contain" /></div>
                    <p className="font-eb-garamond text-xl mt-2" style={{ color: "#4A2545" }}>{label}</p>
                    <p className="font-eb-garamond italic text-xs opacity-50 mt-1" style={{ color: "#7A4A6E" }}>{desc}</p>
                  </WcSelectionCard>
                ))}
              </div>
            </div>
          </section>

          <WashDivider color="#C4AED8" />

          {/* STEP 2: FROSTING */}
          <section ref={(el) => { stepRefs.current[2] = el; }} className="relative min-h-screen flex items-start px-6 py-20 lg:py-32 overflow-hidden">
            <SectionWash color="#C4AED8" />
            <div className="relative z-10 w-full max-w-xl lg:ml-[46%]">
              <StepPill number="02" label="Choose your frosting" color="#C4AED8" />
              <h2 className="font-eb-garamond italic font-medium leading-tight mb-3" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#4A2545" }}>
                Paint the frosting.
              </h2>
              <p className="font-eb-garamond italic text-lg opacity-60 mb-10" style={{ color: "#7A4A6E" }}>How would you like your frosting?</p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {FROSTING_OPTIONS.map(({ id, label, desc, img }) => (
                  <WcSelectionCard key={id} selected={build.frosting === id} onClick={() => set("frosting", id)} accentColor="#C4AED8">
                    <div className="relative w-16 h-16 sm:w-28 sm:h-28 mx-auto"><Image src={img} alt={label} fill sizes="(max-width: 640px) 64px, 112px" className="object-contain" /></div>
                    <p className="font-eb-garamond text-sm mt-2" style={{ color: "#4A2545" }}>{label}</p>
                    <p className="font-eb-garamond italic text-xs opacity-50 mt-0.5 hidden sm:block" style={{ color: "#7A4A6E" }}>{desc}</p>
                  </WcSelectionCard>
                ))}
              </div>

              {/* Rainbow info note */}
              {build.frosting === "rainbow" && (
                <div className="rounded-2xl px-5 py-4 mb-6 flex items-start gap-3"
                  style={{ backgroundColor: "#F5F0E8", border: "1.5px solid #C4AED8" }}>
                  <span className="text-lg mt-0.5">✦</span>
                  <p className="font-eb-garamond text-sm leading-relaxed" style={{ color: "#7A4A6E" }}>
                    Rainbow frosting is a meringue cookie sitting on classic buttercream — vanilla or chocolate to match your cake base. No colour choices needed!
                  </p>
                </div>
              )}

              {/* Colour note textarea for 1-color and 3-color */}
              {(build.frosting === "1-color" || build.frosting === "3-color") && (
                <div className="rounded-3xl p-6 space-y-3 mb-6" style={{ backgroundColor: "#FAF7F2", border: "1.5px solid #E8DDD4" }}>
                  <p className="font-eb-garamond text-lg" style={{ color: "#4A2545" }}>
                    Tell Jo your colour wishes <span className="opacity-40 text-sm">(optional)</span>
                  </p>
                  <textarea
                    value={build.frostingColorNote}
                    onChange={(e) => set("frostingColorNote", e.target.value)}
                    placeholder={build.frosting === "1-color"
                      ? "e.g. soft lavender, hot pink, classic white..."
                      : "e.g. pink, purple and mint, or pastels to match a rainbow theme..."}
                    rows={3}
                    className="w-full rounded-xl px-4 py-3 font-eb-garamond resize-none outline-none transition-colors"
                    style={{ border: "2px solid #E8DDD4", backgroundColor: "white", color: "#4A2545" }}
                    onFocus={(e) => (e.target.style.borderColor = "#C4AED8")}
                    onBlur={(e) => (e.target.style.borderColor = "#E8DDD4")}
                  />
                </div>
              )}

              {build.frosting && (
                <button
                  onClick={() => setTimeout(() => scrollToStep(3), 200)}
                  className="font-eb-garamond text-sm px-6 py-2.5 rounded-full"
                  style={{ backgroundColor: "#C4AED8", color: "#4A2545" }}>
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
            <div className="relative z-10 w-full max-w-xl lg:ml-[46%]">
              <StepPill number="03" label="The finishing touch" color="#A8C8E8" />
              <h2 className="font-eb-garamond italic font-medium leading-tight mb-3" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#4A2545" }}>The finishing touch.</h2>
              <p className="font-eb-garamond italic text-lg opacity-60 mb-6" style={{ color: "#7A4A6E" }}>
                Add a finishing touch to bring your cupcakes to life.
              </p>

              {/* Topper kind toggle */}
              <div className="inline-flex rounded-full p-1 mb-2" style={{ backgroundColor: "#F0EBE3", border: "1.5px solid #E0D8CF" }}>
                {([
                  { val: "none"  as TopperKind, label: "No topper" },
                  { val: "paper" as TopperKind, label: "Paper · +$0.50 each" },
                  { val: "toy"   as TopperKind, label: "Toy · +$1.50 each" },
                ]).map(({ val, label }) => (
                  <button
                    key={val}
                    onClick={() => {
                      setTopperKind(val);
                      if (val === "none") set("topper", "");
                    }}
                    className="rounded-full px-4 py-2 font-eb-garamond text-sm transition-all duration-200"
                    style={{
                      backgroundColor: topperKind === val ? "#A8C8E8" : "transparent",
                      color: topperKind === val ? "#4A2545" : "#A688A0",
                      boxShadow: topperKind === val ? "0 2px 8px rgba(168,200,232,0.4)" : "none",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {/* Contextual description */}
              <p
                className="font-eb-garamond italic text-sm mb-7 transition-opacity duration-200"
                style={{ color: "#7A4A6E", opacity: 0.55 }}
              >
                {TOPPER_KIND_DESC[topperKind]}
              </p>
              <div className={`grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 transition-opacity duration-300 ${topperKind === "none" ? "opacity-30 pointer-events-none" : ""}`}>
                {TOPPER_OPTIONS.map(({ id, label, img }) => (
                  <WcSelectionCard key={id} selected={build.topper === id} onClick={() => set("topper", id)} accentColor="#A8C8E8">
                    <div className="flex flex-col items-center gap-2 py-1">
                      <div className="flex items-center justify-center w-full">
                        {img ? (
                          <div className="relative" style={{ width: 140, height: 140 }}>
                            <Image src={img} alt={label} fill sizes="140px" className="object-contain" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center rounded-2xl" style={{ width: 140, height: 140, backgroundColor: "#F5F0E8", border: "2px dashed #C4AED8" }}>
                            <span className="font-eb-garamond text-4xl" style={{ color: "#C4AED8" }}>?</span>
                          </div>
                        )}
                      </div>
                      <p className="font-eb-garamond text-base" style={{ color: "#4A2545" }}>{label}</p>
                    </div>
                  </WcSelectionCard>
                ))}
              </div>
              {topperKind !== "none" && build.topper === "custom" && (
                <div className="rounded-3xl p-6 space-y-5" style={{ backgroundColor: "#FAF7F2", border: "1.5px solid #E8DDD4" }}>
                  <p className="font-eb-garamond text-lg" style={{ color: "#4A2545" }}>Tell Jo what you&apos;d love ✦</p>
                  <label className="block space-y-2">
                    <span className="font-eb-garamond text-sm opacity-60" style={{ color: "#7A4A6E" }}>Describe your topper</span>
                    <textarea value={build.customTopperDesc} onChange={(e) => set("customTopperDesc", e.target.value)}
                      placeholder="e.g. a little dinosaur in a birthday hat, a mermaid with purple hair..."
                      rows={3}
                      className="w-full rounded-xl px-4 py-3 font-eb-garamond resize-none outline-none transition-colors"
                      style={{ border: "2px solid #E8DDD4", backgroundColor: "white", color: "#4A2545" }}
                      onFocus={(e) => (e.target.style.borderColor = "#C4AED8")}
                      onBlur={(e) => (e.target.style.borderColor = "#E8DDD4")} />
                  </label>
                  <label className="block space-y-2">
                    <span className="font-eb-garamond text-sm opacity-60" style={{ color: "#7A4A6E" }}>Reference image (optional)</span>
                    {customImagePreview ? (
                      <div className="relative inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={customImagePreview} alt="Topper reference" className="max-h-36 rounded-xl object-cover" style={{ border: "2px solid #E8DDD4" }} />
                        {customImageUploading && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(250,247,242,0.8)" }}>
                            <span className="font-eb-garamond text-sm" style={{ color: "#D4788E" }}>Uploading…</span>
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
                        <span className="font-eb-garamond text-sm" style={{ color: "#7A4A6E" }}>Click to upload a reference image</span>
                        <span className="font-eb-garamond italic text-xs opacity-40" style={{ color: "#7A4A6E" }}>JPG, PNG · up to 10 MB</span>
                      </button>
                    )}
                    <input ref={customFileRef} type="file" accept="image/*" className="hidden" onChange={handleCustomImage} />
                    {customImageError && <p className="font-eb-garamond italic text-sm" style={{ color: "#C0392B" }}>{customImageError}</p>}
                  </label>
                </div>
              )}
            </div>
          </section>
      </div>

      {/* SUMMARY */}
      <section className="relative px-6 py-24 overflow-hidden" style={{ backgroundColor: "#F5F0E8", zIndex: 30 }}>
        <SectionWash color="#E8A0B0" />
        <CornerSplash corner="top-left" color="#C4AED8" size={200} className="absolute top-0 left-0" />
        <CornerSplash corner="bottom-right" color="#F0D898" size={180} className="absolute bottom-0 right-0" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-eb-garamond text-base opacity-50 mb-2" style={{ color: "#7A4A6E" }}>— almost done —</p>
            <h2 className="font-eb-garamond italic font-medium" style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", color: "#4A2545" }}>Your cupcake order</h2>
          </div>
          <div className="rounded-3xl p-8 mb-8" style={{ backgroundColor: "#FAF7F2", boxShadow: "0 8px 48px rgba(107,92,82,0.10)", border: "1.5px solid #E8DDD4" }}>
            <div className="space-y-3 mb-8">
              {[
                { label: "Base",     value: build.flavor || "—",            color: "#F2C9A8", done: !!build.flavor,   step: 1 },
                { label: "Frosting", value: frostingLabel || "—",           color: "#C4AED8", done: !!build.frosting, step: 2 },
                { label: "Topper",   value: topperKind === "none" ? "No topper" : (build.topper ? topperLabel : "—"), color: "#A8C8E8", done: topperKind === "none" || !!build.topper, step: 3 },
              ].map(({ label, value, color, done, step }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: done ? color : "#E8DDD4" }} />
                  <span className="font-eb-garamond text-sm opacity-50 w-16 flex-shrink-0" style={{ color: "#7A4A6E" }}>{label}</span>
                  <span className="font-eb-garamond italic capitalize text-sm flex-1" style={{ color: done ? "#4A2545" : "#C0B8B0" }}>{value}</span>
                  {!done && <button onClick={() => scrollToStep(step)} className="font-eb-garamond text-xs underline opacity-40 hover:opacity-70" style={{ color: "#7A4A6E" }}>choose ↑</button>}
                </div>
              ))}
              {build.frostingColorNote && (
                <div className="flex items-start gap-3 pt-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: "#C4AED8" }} />
                  <span className="font-eb-garamond text-sm opacity-50 w-16 flex-shrink-0" style={{ color: "#7A4A6E" }}>Colours</span>
                  <span className="font-eb-garamond italic text-sm flex-1" style={{ color: "#4A2545" }}>{build.frostingColorNote}</span>
                </div>
              )}
            </div>
            <div className="border-t pt-6" style={{ borderColor: "#E8DDD4" }}>
              <p className="font-eb-garamond text-sm opacity-60 mb-4" style={{ color: "#7A4A6E" }}>How many cupcakes?</p>
              <div className="grid grid-cols-3 gap-2">
                {([6, 12, 18, 24, 36, 48] as Qty[]).map((q) => (
                  <button key={q} onClick={() => set("quantity", q)}
                    className="rounded-2xl py-3 flex flex-col items-center transition-all duration-200"
                    style={{ backgroundColor: build.quantity === q ? "#F2C9A8" : "#F5F0E8", border: build.quantity === q ? "2px solid #D4A870" : "2px solid transparent", boxShadow: build.quantity === q ? "0 4px 16px rgba(212,168,112,0.3)" : "none" }}>
                    <span className="font-eb-garamond italic text-2xl font-medium" style={{ color: "#4A2545" }}>{q}</span>
                    <span className="font-eb-garamond text-xs opacity-60" style={{ color: "#7A4A6E" }}>${priceForQty(q)}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t mt-6 pt-6 space-y-2" style={{ borderColor: "#E8DDD4" }}>
              <div className="flex justify-between">
                <span className="font-eb-garamond italic opacity-60" style={{ color: "#7A4A6E" }}>{build.quantity} cupcakes</span>
                <span className="font-eb-garamond italic text-lg" style={{ color: "#4A2545" }}>${basePrice}</span>
              </div>
              {topperKind !== "none" && (
                <div className="flex justify-between">
                  <span className="font-eb-garamond italic opacity-60" style={{ color: "#7A4A6E" }}>{TOPPER_KIND_LABEL[topperKind]}</span>
                  <span className="font-eb-garamond italic text-lg" style={{ color: "#4A2545" }}>+${topperAddon.toFixed(2).replace(".00", "")}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-3" style={{ borderColor: "#E8DDD4" }}>
                <span className="font-eb-garamond text-lg font-bold" style={{ color: "#4A2545" }}>Total</span>
                <span className="font-eb-garamond italic text-2xl font-medium" style={{ color: "#4A2545" }}>${total}</span>
              </div>
              <p className="font-eb-garamond italic text-xs opacity-40 text-right" style={{ color: "#7A4A6E" }}>+${ADDON_DELIVERY} delivery or free pickup</p>
            </div>
          </div>
          <div className="text-center">
            {!isComplete ? (
              <div>
                <p className="font-eb-garamond text-base opacity-50 mb-4" style={{ color: "#7A4A6E" }}>Finish all steps above to continue</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    { label: "Base",     done: !!build.flavor,   step: 1 },
                    { label: "Frosting", done: !!build.frosting, step: 2 },
                    { label: "Topper",   done: topperKind === "none" || !!build.topper, step: 3 },
                  ].map(({ label, done, step }) => (
                    <button key={label} onClick={() => scrollToStep(step)}
                      className="rounded-full px-4 py-1.5 font-eb-garamond text-sm transition-all"
                      style={{ backgroundColor: done ? "#A8C8A833" : "#E8A0B033", border: done ? "1.5px solid #A8C8A8" : "1.5px solid #E8A0B0", color: "#4A2545" }}>
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
                <p className="font-eb-garamond italic text-sm opacity-40 mt-4" style={{ color: "#7A4A6E" }}>
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
        <span className="font-eb-garamond text-sm opacity-40" style={{ color: "#7A4A6E" }}>choose a base ↓</span>
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

function MiniPreview({ build }: { build: BuildState }) {
  const baseImg = build.flavor === "chocolate" ? "/cupcakes/base-choc.png" : build.flavor === "vanilla" ? "/cupcakes/base-vanilla.png" : null;
  const frostingImg = build.frosting ? FROSTING_OPTIONS.find((f) => f.id === build.frosting)?.img : null;
  const topperImg = build.topper && build.topper !== "custom" ? TOPPER_OPTIONS.find((t) => t.id === build.topper)?.img : null;

  if (!baseImg) {
    return (
      <div className="w-full h-full rounded-xl flex items-center justify-center" style={{ backgroundColor: "#F5F0E8" }}>
        <span className="text-lg opacity-30">🧁</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Base — anchored to bottom */}
      <div className="absolute bottom-2 inset-x-0 h-14">
        <Image src={baseImg} alt="base" fill sizes="72px" className="object-contain object-bottom" />
      </div>
      {/* Frosting — sits on top of base */}
      {frostingImg && (
        <div className="absolute bottom-4 inset-x-0 h-14">
          <Image src={frostingImg} alt="frosting" fill sizes="72px" className="object-contain object-bottom" />
        </div>
      )}
      {/* Topper — sits on top of frosting tip */}
      {topperImg && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-10 h-10">
          <Image src={topperImg} alt="topper" fill sizes="40px" className="object-contain object-bottom" />
        </div>
      )}
      {build.topper === "custom" && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 font-eb-garamond text-lg leading-none font-bold" style={{ color: "#C4AED8" }}>?</div>
      )}
    </div>
  );
}

function MobileStepChip({ children, done, color, onClick }: { children: React.ReactNode; done: boolean; color: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 min-w-0 font-eb-garamond text-xs px-2 py-1 rounded-full capitalize transition-all truncate text-center"
      style={{
        backgroundColor: done ? color + "66" : "#F0EBE4",
        border: `1.5px solid ${done ? color : "#D8D0C8"}`,
        color: "#4A2545",
      }}
    >
      {done ? "✓ " : ""}{children}
    </button>
  );
}

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="font-eb-garamond text-xs px-2.5 py-1 rounded-full capitalize"
      style={{ backgroundColor: color + "44", border: `1px solid ${color}88`, color: "#4A2545" }}>
      {children}
    </span>
  );
}
