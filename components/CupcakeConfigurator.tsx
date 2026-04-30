"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ICING_COLOR_OPTIONS, PRICES } from "@/lib/pricing";

// ─── Types ────────────────────────────────────────────────────────────────────

type Flavor = "chocolate" | "vanilla" | "";
type Topping = "sprinkles" | "glitter" | "topper" | "none" | "";

interface Selections {
  flavor: Flavor;
  icing: string[];
  topping: Topping;
  quantity: number;
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  {
    id: "flavor" as const,
    num: "01",
    label: "Flavor",
    title: "What's the base?",
    description: "Every great cupcake starts with the perfect cake.",
    accent: "#FDE4CF",
    accentDeep: "#F9C29E",
    emoji: "🍫",
  },
  {
    id: "icing" as const,
    num: "02",
    label: "Icing Colors",
    title: "Paint the frosting.",
    description: "Mix up to five dreamy shades — they'll swirl together like magic.",
    accent: "#F1C0E8",
    accentDeep: "#E096D0",
    emoji: "🎨",
  },
  {
    id: "topping" as const,
    num: "03",
    label: "Topping",
    title: "Finish with flair.",
    description: "A little sparkle or a custom topper — the final flourish.",
    accent: "#CFBAF0",
    accentDeep: "#B89EE0",
    emoji: "✨",
  },
  {
    id: "quantity" as const,
    num: "04",
    label: "How Many?",
    title: "Count your wishes.",
    description: "Choose your dozen — the more the merrier.",
    accent: "#A3C4F3",
    accentDeep: "#7EAAEA",
    emoji: "🧁",
  },
] as const;

const TOPPINGS = [
  { id: "sprinkles" as const, label: "Sprinkles", emoji: "🌈" },
  { id: "glitter" as const, label: "Glitter", emoji: "✨" },
  { id: "topper" as const, label: "Custom Topper +$8", emoji: "🎨" },
  { id: "none" as const, label: "Just Frosting", emoji: "🧁" },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function CupcakeConfigurator() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const [selections, setSelections] = useState<Selections>({
    flavor: "",
    icing: [],
    topping: "",
    quantity: 0,
  });
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Track active step via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    stepRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveStep(i);
          });
        },
        { threshold: 0.4, rootMargin: "-15% 0px -15% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  function toggleIcing(id: string) {
    setSelections((prev) => {
      const has = prev.icing.includes(id);
      if (!has && prev.icing.length >= 5) return prev;
      return {
        ...prev,
        icing: has ? prev.icing.filter((c) => c !== id) : [...prev.icing, id],
      };
    });
  }

  const isComplete =
    !!selections.flavor &&
    selections.icing.length > 0 &&
    !!selections.topping &&
    selections.quantity > 0;

  function handleStartOrder() {
    const params = new URLSearchParams();
    if (selections.flavor) params.set("flavor", selections.flavor);
    if (selections.icing.length) params.set("icing", selections.icing.join(","));
    if (selections.topping) params.set("topping", selections.topping);
    if (selections.quantity) params.set("qty", String(selections.quantity));
    router.push(`/order?${params.toString()}`);
  }

  const step = STEPS[activeStep];

  return (
    <section id="build" className="py-4">
      <div className="max-w-6xl mx-auto px-6">
        <div className="lg:flex lg:gap-16 lg:items-start">

          {/* ── LEFT: sticky image + progress ──────────────────────────────── */}
          <div className="hidden lg:block lg:w-5/12 flex-shrink-0">
            <div className="sticky top-8 h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-8">

              {/* Cupcake image */}
              <div
                className="relative w-full max-w-[320px] aspect-square rounded-3xl overflow-hidden shadow-2xl transition-all duration-700"
                style={{ backgroundColor: step.accent }}
              >
                {/* Placeholder (behind) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[96px] leading-none select-none">{step.emoji}</span>
                  <p className="font-im-fell-sc text-plum/30 text-[11px] tracking-wide mt-3 text-center px-6">
                    Add photo: /public/cupcakes/step-{activeStep + 1}-{STEPS[activeStep].id}.jpg
                  </p>
                </div>
                {/* Real photo (overlays placeholder when present) */}
                {!imgErrors[activeStep] && (
                  <Image
                    key={activeStep}
                    src={`/cupcakes/step-${activeStep + 1}-${STEPS[activeStep].id}.jpg`}
                    alt={STEPS[activeStep].label}
                    fill
                    className="object-cover"
                    onError={() =>
                      setImgErrors((prev) => ({ ...prev, [activeStep]: true }))
                    }
                    priority={activeStep === 0}
                  />
                )}
              </div>

              {/* Progress pills */}
              <div className="flex items-center gap-2">
                {STEPS.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() =>
                      stepRefs.current[i]?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      })
                    }
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === activeStep ? 32 : 10,
                      height: 10,
                      backgroundColor:
                        i < activeStep
                          ? STEPS[i].accentDeep
                          : i === activeStep
                          ? STEPS[i].accentDeep
                          : "#E2E8F0",
                    }}
                    aria-label={`Jump to step ${i + 1}: ${s.label}`}
                  />
                ))}
              </div>

              {/* Step label */}
              <p className="font-im-fell-sc text-plum/50 text-xs tracking-widest uppercase">
                Step {activeStep + 1} of {STEPS.length} · {step.label}
              </p>
            </div>
          </div>

          {/* ── RIGHT: scrollable step cards ───────────────────────────────── */}
          <div className="w-full lg:w-7/12">

            {/* Step 1: Flavor */}
            <div
              ref={(el) => { stepRefs.current[0] = el; }}
              className="min-h-screen py-16 flex items-center"
            >
              <StepCard step={STEPS[0]}>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {(["chocolate", "vanilla"] as const).map((f) => (
                    <ChoiceButton
                      key={f}
                      selected={selections.flavor === f}
                      accent={STEPS[0].accent}
                      accentDeep={STEPS[0].accentDeep}
                      onClick={() =>
                        setSelections((prev) => ({ ...prev, flavor: f }))
                      }
                    >
                      <span className="text-5xl mb-3 block">
                        {f === "chocolate" ? "🍫" : "🌼"}
                      </span>
                      <span className="font-cormorant italic text-berry text-2xl capitalize">
                        {f}
                      </span>
                    </ChoiceButton>
                  ))}
                </div>
              </StepCard>
            </div>

            {/* Step 2: Icing Colors */}
            <div
              ref={(el) => { stepRefs.current[1] = el; }}
              className="min-h-screen py-16 flex items-center"
            >
              <StepCard step={STEPS[1]}>
                <p className="font-im-fell italic text-plum/50 text-sm mt-1">
                  {selections.icing.length}/5 selected
                </p>
                <div className="grid grid-cols-5 gap-4 mt-6">
                  {ICING_COLOR_OPTIONS.map((color) => {
                    const selected = selections.icing.includes(color.id);
                    const atMax = selections.icing.length >= 5 && !selected;
                    return (
                      <button
                        key={color.id}
                        onClick={() => !atMax && toggleIcing(color.id)}
                        disabled={atMax}
                        title={color.label}
                        className="flex flex-col items-center gap-2 group transition-all duration-200"
                        style={{ opacity: atMax ? 0.3 : 1 }}
                      >
                        <div
                          className="w-12 h-12 rounded-full border-4 transition-all duration-200 group-hover:scale-110"
                          style={{
                            backgroundColor: color.hex,
                            borderColor: selected ? "#6B2547" : "#E2E8F0",
                            boxShadow: selected
                              ? "0 0 0 2px white, 0 0 0 4px #6B2547"
                              : "none",
                          }}
                        />
                        <span className="font-im-fell-sc text-[10px] text-plum/60 tracking-wide text-center leading-tight">
                          {color.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {/* Selected palette preview */}
                {selections.icing.length > 0 && (
                  <div className="mt-6 flex items-center gap-3">
                    <span className="font-im-fell italic text-plum/40 text-xs">
                      Your palette:
                    </span>
                    {selections.icing.map((id) => {
                      const c = ICING_COLOR_OPTIONS.find((o) => o.id === id)!;
                      return (
                        <div
                          key={id}
                          className="w-7 h-7 rounded-full border-2 border-white shadow"
                          style={{ backgroundColor: c.hex }}
                          title={c.label}
                        />
                      );
                    })}
                  </div>
                )}
              </StepCard>
            </div>

            {/* Step 3: Topping */}
            <div
              ref={(el) => { stepRefs.current[2] = el; }}
              className="min-h-screen py-16 flex items-center"
            >
              <StepCard step={STEPS[2]}>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {TOPPINGS.map((t) => (
                    <ChoiceButton
                      key={t.id}
                      selected={selections.topping === t.id}
                      accent={STEPS[2].accent}
                      accentDeep={STEPS[2].accentDeep}
                      onClick={() =>
                        setSelections((prev) => ({ ...prev, topping: t.id }))
                      }
                    >
                      <span className="text-4xl mb-2 block">{t.emoji}</span>
                      <span className="font-cormorant italic text-berry text-xl">
                        {t.label}
                      </span>
                    </ChoiceButton>
                  ))}
                </div>
              </StepCard>
            </div>

            {/* Step 4: Quantity + summary */}
            <div
              ref={(el) => { stepRefs.current[3] = el; }}
              className="min-h-screen py-16 flex items-center"
            >
              <StepCard step={STEPS[3]}>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-6">
                  {([6, 12, 18, 24, 36, 48] as const).map((qty) => (
                    <ChoiceButton
                      key={qty}
                      selected={selections.quantity === qty}
                      accent={STEPS[3].accent}
                      accentDeep={STEPS[3].accentDeep}
                      onClick={() =>
                        setSelections((prev) => ({ ...prev, quantity: qty }))
                      }
                    >
                      <span className="font-cormorant italic text-berry text-4xl font-medium block">
                        {qty}
                      </span>
                      <span className="font-im-fell-sc text-plum text-xs">
                        ${PRICES[qty]}
                      </span>
                    </ChoiceButton>
                  ))}
                </div>

                {/* Order summary + CTA */}
                <div
                  className="mt-10 p-6 rounded-2xl border"
                  style={{
                    backgroundColor: STEPS[3].accent,
                    borderColor: STEPS[3].accentDeep,
                  }}
                >
                  <h3 className="font-cormorant italic text-berry text-2xl mb-4">
                    Your order so far
                  </h3>
                  <div className="space-y-2 mb-6">
                    {[
                      {
                        label: "Flavor",
                        value: selections.flavor || "—",
                        done: !!selections.flavor,
                      },
                      {
                        label: "Icing",
                        value:
                          selections.icing.length > 0
                            ? `${selections.icing.length} color${selections.icing.length !== 1 ? "s" : ""}`
                            : "—",
                        done: selections.icing.length > 0,
                      },
                      {
                        label: "Topping",
                        value: selections.topping
                          ? TOPPINGS.find((t) => t.id === selections.topping)
                              ?.label ?? "—"
                          : "—",
                        done: !!selections.topping,
                      },
                      {
                        label: "Quantity",
                        value: selections.quantity
                          ? `${selections.quantity} cupcakes`
                          : "—",
                        done: selections.quantity > 0,
                      },
                    ].map(({ label, value, done }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-im-fell-sc text-plum/60 tracking-wide">
                          {label}
                        </span>
                        <span
                          className={`font-im-fell italic capitalize ${
                            done ? "text-berry font-medium" : "text-plum/30"
                          }`}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleStartOrder}
                    disabled={!isComplete}
                    className="w-full py-4 rounded-pill font-im-fell-sc tracking-wide text-white transition-all duration-150"
                    style={{
                      backgroundColor: isComplete ? "#6B2547" : "#C4B5C0",
                      boxShadow: isComplete
                        ? `0 3px 0 ${STEPS[3].accentDeep}`
                        : "none",
                    }}
                  >
                    {isComplete ? "✦ Start my order →" : "Complete all steps above"}
                  </button>
                  {!isComplete && (
                    <p className="font-im-fell italic text-plum/40 text-xs text-center mt-3">
                      Fill in flavor, icing, topping & quantity to continue
                    </p>
                  )}
                </div>
              </StepCard>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepCard({
  step,
  children,
}: {
  step: (typeof STEPS)[number];
  children: React.ReactNode;
}) {
  return (
    <div
      className="w-full rounded-3xl p-8 md:p-10 bg-white/80 backdrop-blur-sm shadow-lg border-l-[6px]"
      style={{ borderLeftColor: step.accentDeep }}
    >
      {/* Step badge */}
      <div
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-im-fell-sc text-berry tracking-wide mb-4"
        style={{ backgroundColor: step.accent }}
      >
        Step {step.num}
      </div>
      <h2 className="font-cormorant italic text-berry text-4xl md:text-5xl font-medium leading-tight">
        {step.title}
      </h2>
      <p className="font-im-fell italic text-plum mt-2 text-lg leading-relaxed">
        {step.description}
      </p>
      {children}
    </div>
  );
}

function ChoiceButton({
  selected,
  accent,
  accentDeep,
  onClick,
  children,
}: {
  selected: boolean;
  accent: string;
  accentDeep: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="py-7 px-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-200 hover:scale-[1.02]"
      style={{
        backgroundColor: selected ? accent : "white",
        borderColor: selected ? accentDeep : "#E2E8F0",
        boxShadow: selected ? `0 4px 20px ${accent}99` : undefined,
      }}
    >
      {children}
    </button>
  );
}
