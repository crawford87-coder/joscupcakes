"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Divider } from "@/components/Decorative";
import {
  PRICES,
  ADDON_TOPPER,
  ADDON_EXTRAS,
  ADDON_DELIVERY,
  calculateTotal,
  isAustinISDZip,
  isPickupDateValid,
  minLeadTimeHours,
  ICING_COLOR_OPTIONS,
} from "@/lib/pricing";

type Fulfillment = "pickup" | "delivery";
type Extras = "sprinkles" | "glitter" | "";

interface FormState {
  name: string;
  email: string;
  phone: string;
  pickupDate: string;
  pickupTime: string;
  fulfillment: Fulfillment;
  deliveryAddress: string;
  deliveryZip: string;
  quantity: number;
  flavor: "chocolate" | "vanilla" | "";
  icingColors: string[];
  customColor: string;
  topper: boolean;
  topperDescription: string;
  extras: Extras;
  notes: string;
  honeypot: string;
}

const INITIAL: FormState = {
  name: "",
  email: "",
  phone: "",
  pickupDate: "",
  pickupTime: "",
  fulfillment: "pickup",
  deliveryAddress: "",
  deliveryZip: "",
  quantity: 12,
  flavor: "",
  icingColors: [],
  customColor: "",
  topper: false,
  topperDescription: "",
  extras: "",
  notes: "",
  honeypot: "",
};

type FieldError = Partial<Record<keyof FormState | "form", string>>;

export default function OrderForm() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState<FormState>(INITIAL);

  // Pre-fill from configurator query params (?flavor=X&icing=X,Y&topping=X&qty=N)
  useEffect(() => {
    const flavor = searchParams.get("flavor");
    const icing = searchParams.get("icing");
    const topping = searchParams.get("topping");
    const qty = searchParams.get("qty");
    const validFlavors = ["chocolate", "vanilla"] as const;
    const validToppings = ["sprinkles", "glitter", "topper", "none"] as const;
    const validQtys = [6, 12, 18, 24, 36, 48] as const;
    const validIcingIds = new Set(ICING_COLOR_OPTIONS.map((c) => c.id));
    setForm((prev) => ({
      ...prev,
      ...(flavor && (validFlavors as readonly string[]).includes(flavor)
        ? { flavor: flavor as "chocolate" | "vanilla" }
        : {}),
      ...(icing
        ? {
            icingColors: icing
              .split(",")
              .filter((id) => validIcingIds.has(id))
              .slice(0, 5),
          }
        : {}),
      ...(topping && (validToppings as readonly string[]).includes(topping)
        ? {
            topper: topping === "topper",
            extras:
              topping === "sprinkles" || topping === "glitter"
                ? (topping as "sprinkles" | "glitter")
                : "",
          }
        : {}),
      ...(qty && (validQtys as readonly number[]).includes(Number(qty))
        ? { quantity: Number(qty) }
        : {}),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [errors, setErrors] = useState<FieldError>({});
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Live total
  const total = useMemo(
    () =>
      calculateTotal({
        quantity: form.quantity,
        topper: form.topper,
        hasExtras: form.extras !== "",
        delivery: form.fulfillment === "delivery",
      }),
    [form.quantity, form.topper, form.extras, form.fulfillment]
  );

  // Summary string
  const summary = useMemo(() => {
    const parts: string[] = [
      `${form.quantity} ${form.flavor || "cupcake"}s`,
    ];
    if (form.icingColors.length > 0)
      parts.push(`${form.icingColors.length} color${form.icingColors.length > 1 ? "s" : ""}`);
    if (form.topper) parts.push("topper");
    if (form.extras === "glitter") parts.push("glitter");
    if (form.extras === "sprinkles") parts.push("sprinkles");
    if (form.fulfillment === "delivery") parts.push("delivery");
    return parts.join(" · ");
  }, [form]);

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    []
  );

  function toggleColor(id: string) {
    setForm((prev) => {
      const has = prev.icingColors.includes(id);
      if (!has && prev.icingColors.length >= 5) return prev;
      return {
        ...prev,
        icingColors: has
          ? prev.icingColors.filter((c) => c !== id)
          : [...prev.icingColors, id],
      };
    });
  }

  // Today's date in YYYY-MM-DD for min attribute — computed client-side only to avoid hydration mismatch
  const [todayStr, setTodayStr] = useState("");
  useEffect(() => {
    setTodayStr(new Date().toISOString().split("T")[0]);
  }, []);

  function validate(): FieldError {
    const e: FieldError = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Valid email is required.";
    if (!form.phone.trim()) e.phone = "Phone is required.";
    if (!form.pickupTime) e.pickupTime = "Please choose a preferred time.";
    if (!form.pickupDate) {
      e.pickupDate = "Pickup date is required.";
    } else if (!isPickupDateValid(form.pickupDate, form.quantity)) {
      const hours = minLeadTimeHours(form.quantity);
      e.pickupDate =
        hours >= 168
          ? "Orders of 24+ cupcakes need at least 1 week lead time."
          : "Please allow at least 72 hours lead time.";
    }
    if (form.fulfillment === "delivery") {
      if (!form.deliveryAddress.trim()) e.deliveryAddress = "Address is required for delivery.";
      if (!form.deliveryZip.trim()) {
        e.deliveryZip = "ZIP code is required for delivery.";
      } else if (!isAustinISDZip(form.deliveryZip)) {
        e.deliveryZip = "Sorry — delivery is only available within Austin ISD boundaries.";
      }
    }
    if (!form.flavor) e.flavor = "Please choose a flavor.";
    if (form.icingColors.length === 0) e.icingColors = "Please pick at least one icing color.";
    if (form.topper && !form.topperDescription.trim())
      e.topperDescription = "Please describe your topper idea.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.honeypot) return; // silently reject spam

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          pickupDate: form.pickupDate,
          fulfillmentType: form.fulfillment,
          deliveryAddress:
            form.fulfillment === "delivery"
              ? `${form.deliveryAddress}, ${form.deliveryZip}`
              : null,
          quantity: form.quantity,
          flavor: form.flavor,
          icingColors: form.icingColors,
          topper: form.topper,
          topperDescription: form.topper ? form.topperDescription : null,
          sprinklesOrGlitter: form.extras || null,
          pickupTime: form.pickupTime || null,
          notes: form.notes || null,
          totalPrice: total,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setReferenceNumber(data.referenceNumber);
      setSubmitted(true);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return <SuccessScreen referenceNumber={referenceNumber} />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-10">
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        value={form.honeypot}
        onChange={(e) => set("honeypot", e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {/* Lead-time notice */}
      <div className="card border-2 border-dashed border-lavender bg-lavender/10 text-center">
        <p className="font-im-fell italic text-plum text-sm">
          72 hours minimum. One full week for 24 or more.
        </p>
      </div>

      {/* Contact */}
      <fieldset className="space-y-4">
        <SectionHeading>Your details</SectionHeading>
        <div className="grid md:grid-cols-2 gap-4">
          <Field
            label="Name"
            required
            error={errors.name}
          >
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Your name"
              className={inputCls(!!errors.name)}
            />
          </Field>
          <Field label="Email" required error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
              className={inputCls(!!errors.email)}
            />
          </Field>
          <Field label="Phone" required error={errors.phone}>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="(512) 555-0100"
              className={inputCls(!!errors.phone)}
            />
          </Field>
        </div>
      </fieldset>

      <Divider />

      {/* Quantity */}
      <fieldset>
        <SectionHeading>How many cupcakes?</SectionHeading>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {([6, 12, 18, 24, 36, 48] as const).map((qty) => (
            <RadioCard
              key={qty}
              selected={form.quantity === qty}
              onClick={() => set("quantity", qty)}
            >
              <span className="font-cormorant italic text-berry text-3xl font-medium">{qty}</span>
              <span className="font-im-fell-sc text-plum text-xs">${PRICES[qty]}</span>
            </RadioCard>
          ))}
        </div>
      </fieldset>

      <Divider />

      {/* Flavor */}
      <fieldset>
        <SectionHeading>Choose your flavor</SectionHeading>
        {errors.flavor && <ErrorMsg>{errors.flavor}</ErrorMsg>}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {(["chocolate", "vanilla"] as const).map((f) => (
            <RadioCard
              key={f}
              selected={form.flavor === f}
              onClick={() => set("flavor", f)}
            >
              <span className="font-cormorant italic text-berry text-2xl capitalize">{f}</span>
            </RadioCard>
          ))}
        </div>
      </fieldset>

      <Divider />

      {/* Icing colors */}
      <fieldset>
        <SectionHeading>Pick your icing colors</SectionHeading>
        <p className="font-im-fell italic text-plum/60 text-sm mt-1 mb-4">
          Up to 5 — included in your price ✨
        </p>
        {errors.icingColors && <ErrorMsg>{errors.icingColors}</ErrorMsg>}
        <div className="flex flex-wrap gap-3">
          {ICING_COLOR_OPTIONS.map(({ id, label, hex }) => {
            const selected = form.icingColors.includes(id);
            const disabled = !selected && form.icingColors.length >= 5;
            return (
              <button
                key={id}
                type="button"
                onClick={() => !disabled && toggleColor(id)}
                disabled={disabled}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                  selected
                    ? "border-rose shadow-btn"
                    : disabled
                    ? "border-border-pink opacity-40 cursor-not-allowed"
                    : "border-border-pink hover:border-rose-light"
                }`}
              >
                <span
                  className="w-8 h-8 rounded-full border border-border-pink"
                  style={{ background: hex }}
                />
                <span className="font-im-fell-sc text-plum text-xs">{label}</span>
              </button>
            );
          })}
          {/* Custom color */}
          <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 border-dashed border-border-pink">
            <input
              type="color"
              value={form.customColor || "#ffffff"}
              onChange={(e) => {
                const hex = e.target.value;
                set("customColor", hex);
                // add as "custom" slot if space
                if (!form.icingColors.includes("custom") && form.icingColors.length < 5) {
                  setForm((prev) => ({ ...prev, icingColors: [...prev.icingColors, "custom"], customColor: hex }));
                } else if (form.icingColors.includes("custom")) {
                  set("customColor", hex);
                }
              }}
              className="w-8 h-8 rounded-full cursor-pointer border-0 p-0 bg-transparent"
              title="Pick a custom color"
            />
            <span className="font-im-fell-sc text-plum text-xs">Custom</span>
          </div>
        </div>
      </fieldset>

      <Divider />

      {/* Extras */}
      <fieldset className="space-y-5">
        <SectionHeading>Add a little extra magic</SectionHeading>

        {/* Topper */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-cormorant italic text-berry text-xl">Custom topper</p>
              <p className="font-im-fell italic text-plum/60 text-sm">+${ADDON_TOPPER}</p>
            </div>
            <Toggle checked={form.topper} onChange={(v) => set("topper", v)} />
          </div>
          {form.topper && (
            <div>
              <textarea
                value={form.topperDescription}
                onChange={(e) => set("topperDescription", e.target.value)}
                placeholder="Describe your topper — a princess rainbow kitten, a roaring T-Rex, a number 5..."
                rows={2}
                className={`${inputCls(!!errors.topperDescription)} resize-none`}
              />
              {errors.topperDescription && <ErrorMsg>{errors.topperDescription}</ErrorMsg>}
            </div>
          )}
        </div>

        {/* Sprinkles / glitter */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-cormorant italic text-berry text-xl">Sprinkles or edible glitter</p>
              <p className="font-im-fell italic text-plum/60 text-sm">+${ADDON_EXTRAS}</p>
            </div>
            <Toggle
              checked={form.extras !== ""}
              onChange={(v) => set("extras", v ? "sprinkles" : "")}
            />
          </div>
          {form.extras !== "" && (
            <div className="grid grid-cols-2 gap-3">
              <RadioCard selected={form.extras === "sprinkles"} onClick={() => set("extras", "sprinkles")}>
                <span className="font-im-fell italic text-plum">Sprinkles</span>
              </RadioCard>
              <RadioCard selected={form.extras === "glitter"} onClick={() => set("extras", "glitter")}>
                <span className="font-im-fell italic text-plum">Edible glitter — stardust on every swirl</span>
              </RadioCard>
            </div>
          )}
        </div>
      </fieldset>

      <Divider />

      {/* Pickup date + fulfillment */}
      <fieldset className="space-y-5">
        <SectionHeading>When&apos;s the big day?</SectionHeading>

        {/* Pickup vs delivery */}
        <div className="grid grid-cols-2 gap-4">
          {(["pickup", "delivery"] as const).map((type) => (
            <RadioCard
              key={type}
              selected={form.fulfillment === type}
              onClick={() => set("fulfillment", type)}
            >
              <span className="font-cormorant italic text-berry text-xl capitalize">{type}</span>
              {type === "delivery" && (
                <span className="font-im-fell italic text-plum/60 text-xs">+${ADDON_DELIVERY} — Austin ISD only</span>
              )}
              {type === "pickup" && (
                <span className="font-im-fell italic text-plum/60 text-xs">Free — address sent when confirmed</span>
              )}
            </RadioCard>
          ))}
        </div>

        {/* Delivery address */}
        {form.fulfillment === "delivery" && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Field label="Street address" required error={errors.deliveryAddress}>
                <input
                  type="text"
                  value={form.deliveryAddress}
                  onChange={(e) => set("deliveryAddress", e.target.value)}
                  placeholder="1234 Bluebonnet Dr, Austin"
                  className={inputCls(!!errors.deliveryAddress)}
                />
              </Field>
            </div>
            <Field label="ZIP code" required error={errors.deliveryZip}>
              <input
                type="text"
                value={form.deliveryZip}
                onChange={(e) => set("deliveryZip", e.target.value)}
                placeholder="78704"
                maxLength={5}
                className={inputCls(!!errors.deliveryZip)}
              />
            </Field>
          </div>
        )}

        {/* Date */}
        <Field label="Pickup date" required error={errors.pickupDate}>
          <input
            type="date"
            value={form.pickupDate}
            min={todayStr}
            onChange={(e) => set("pickupDate", e.target.value)}
            className={inputCls(!!errors.pickupDate)}
          />
        </Field>

        {/* Preferred time */}
        <fieldset>
          <legend className="font-im-fell-sc text-plum text-sm tracking-wide mb-2">
            Preferred time <span className="text-rose ml-1">*</span>
          </legend>
          {errors.pickupTime && <ErrorMsg>{errors.pickupTime}</ErrorMsg>}
          <div className="grid grid-cols-3 gap-3 mt-2">
            {(["9 am – 12 pm", "12 pm – 3 pm", "3 pm – 6 pm"] as const).map((slot) => (
              <RadioCard
                key={slot}
                selected={form.pickupTime === slot}
                onClick={() => set("pickupTime", slot)}
              >
                <span className="font-im-fell italic text-plum text-sm text-center">{slot}</span>
              </RadioCard>
            ))}
          </div>
        </fieldset>
      </fieldset>

      <Divider />

      {/* Notes */}
      <fieldset>
        <SectionHeading>Anything else we should know?</SectionHeading>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Allergies, themed colors, anything special..."
          rows={3}
          className={`${inputCls(false)} resize-none mt-4`}
        />
      </fieldset>

      <Divider />

      {/* Live total */}
      <div className="rounded-2xl p-6 md:p-8 text-center bg-gradient-to-br from-pink-soft/30 via-lavender/20 to-mint/20 border-2 border-dashed border-border-pink">
        <p className="font-im-fell-sc text-plum/60 text-xs tracking-widest uppercase mb-2">
          Your magic adds up to
        </p>
        <p className="font-cormorant italic text-berry text-6xl md:text-7xl font-medium">
          ${total}
        </p>
        <p className="font-im-fell italic text-plum/60 text-sm mt-2">{summary}</p>
      </div>

      {errors.form && (
        <div className="card border-2 border-red-300 bg-red-50 text-center">
          <p className="font-im-fell italic text-red-700">{errors.form}</p>
        </div>
      )}

      <div className="text-center">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary text-lg px-12 py-4 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
        >
          {submitting ? "Sending..." : "✦ Send my wish to Jo ✦"}
        </button>
      </div>
    </form>
  );
}

// ── Sub-components ────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-cormorant italic text-berry text-3xl font-medium mb-2">
      {children}
    </h2>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="font-im-fell-sc text-plum text-sm tracking-wide">
        {label}
        {required && <span className="text-rose ml-1">*</span>}
      </span>
      {children}
      {error && <ErrorMsg>{error}</ErrorMsg>}
    </label>
  );
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <span className="block font-im-fell italic text-red-600 text-sm mt-1">{children}</span>
  );
}

function RadioCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`card flex flex-col items-center justify-center gap-1 p-4 cursor-pointer transition-all border-2 ${
        selected
          ? "border-rose shadow-btn bg-rose/5"
          : "border-transparent hover:border-border-pink"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        checked ? "bg-rose" : "bg-border-pink"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function inputCls(hasError: boolean) {
  return `w-full rounded-xl border-2 px-4 py-2.5 font-im-fell italic text-plum bg-white placeholder:text-plum/30 outline-none transition-colors focus:border-rose ${
    hasError ? "border-red-400" : "border-border-pink"
  }`;
}

function SuccessScreen({ referenceNumber }: { referenceNumber: string }) {
  return (
    <div className="card text-center py-16 space-y-6 max-w-lg mx-auto">
      <div className="text-5xl">✦</div>
      <h2 className="font-cormorant italic text-berry text-5xl font-medium">
        Your wish is on its way
      </h2>
      <div className="card bg-gradient-to-br from-pink-soft/30 to-lavender/20">
        <p className="font-im-fell-sc text-plum text-sm tracking-widest">
          Reference number
        </p>
        <p className="font-cormorant italic text-berry text-3xl font-medium mt-1">
          {referenceNumber}
        </p>
      </div>
      <p className="font-im-fell italic text-plum text-lg leading-relaxed">
        Jo will write back within a day with the total and pickup details. Keep
        an eye on your inbox — and check spam, just in case the fairies misroute
        it.
      </p>
      <a href="/" className="btn-primary inline-flex">
        Back to the beginning
      </a>
    </div>
  );
}
