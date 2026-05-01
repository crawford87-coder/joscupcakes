"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  PRICES,
  ADDON_DELIVERY,
  calculateTotal,
  isAustinISDZip,
  isPickupDateValid,
  minLeadTimeHours,
} from "@/lib/pricing";

// ── Label maps ────────────────────────────────────────────────

const FLAVOR_LABELS: Record<string, string> = {
  vanilla: "Vanilla",
  chocolate: "Chocolate",
};

const FROSTING_LABELS: Record<string, string> = {
  "1-color": "1-colour frosting",
  "3-color": "3-colour frosting",
  "rainbow": "Rainbow frosting",
};

const TOPPER_LABELS: Record<string, string> = {
  unicorn: "Unicorn topper",
  safari: "Safari topper",
  "cats-dogs": "Cats & dogs topper",
  dinosaurs: "Dinosaurs topper",
  fairies: "Fairies topper",
  butterflies: "Butterflies topper",
};

// ── Types ─────────────────────────────────────────────────────

interface FormState {
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  fulfillment: "pickup" | "delivery";
  deliveryAddress: string;
  deliveryZip: string;
  notes: string;
  honeypot: string;
}

type FieldError = Partial<Record<keyof FormState | "form" | "image", string>>;

const INITIAL: FormState = {
  name: "",
  email: "",
  phone: "",
  eventDate: "",
  fulfillment: "pickup",
  deliveryAddress: "",
  deliveryZip: "",
  notes: "",
  honeypot: "",
};

// ── Main component ────────────────────────────────────────────

export default function OrderForm() {
  const searchParams = useSearchParams();

  // Selections from the builder (all from URL params)
  const flavor = (searchParams.get("flavor") || "vanilla") as "vanilla" | "chocolate";
  const frostingType = searchParams.get("frostingType") || "1-color";
  const frostingColorNote = searchParams.get("frostingColorNote") || "";
  const topperDesc = searchParams.get("topperDesc") || ""; // unicorn|safari|etc
  const rawQty = Number(searchParams.get("qty") || "12");
  const qty = ([6, 12, 18, 24, 36, 48].includes(rawQty) ? rawQty : 12) as 6 | 12 | 18 | 24 | 36 | 48;

  const hasTopper = !!topperDesc;

  // Form state
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<FieldError>({});
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [todayStr, setTodayStr] = useState("");

  // Image upload state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTodayStr(new Date().toISOString().split("T")[0]);
  }, []);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  // Derived total (re-computed when fulfillment changes)
  const total = calculateTotal({
    quantity: qty,
    topper: hasTopper,
    delivery: form.fulfillment === "delivery",
  });

  // ── Image upload ──────────────────────────────────────────

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      setImageError(`Image must be under ${MAX_MB} MB.`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setImageError("Only image files are accepted.");
      return;
    }

    setImageError(null);

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Supabase storage
    setImageUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("reference-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage
        .from("reference-images")
        .getPublicUrl(fileName);
      setImageUrl(data.publicUrl);
    } catch {
      // Non-fatal — image is optional
      setImageError("Image couldn't be uploaded. You can still submit your order without it.");
      setImageUrl(null);
    } finally {
      setImageUploading(false);
    }
  }

  function removeImage() {
    setImagePreview(null);
    setImageUrl(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Validation ────────────────────────────────────────────

  function validate(): FieldError {
    const e: FieldError = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Valid email is required.";
    if (!form.phone.trim()) e.phone = "Phone number is required.";
    if (!form.eventDate) {
      e.eventDate = "Please choose your event date.";
    } else if (!isPickupDateValid(form.eventDate, qty)) {
      const hours = minLeadTimeHours(qty);
      e.eventDate =
        hours >= 168
          ? "Orders of 24+ need at least 1 week lead time."
          : "Please allow at least 72 hours lead time.";
    }
    if (form.fulfillment === "delivery") {
      if (!form.deliveryAddress.trim()) e.deliveryAddress = "Street address is required.";
      if (!form.deliveryZip.trim()) {
        e.deliveryZip = "ZIP code is required.";
      } else if (!isAustinISDZip(form.deliveryZip)) {
        e.deliveryZip = "Delivery is only available within Austin ISD boundaries.";
      }
    }
    return e;
  }

  // ── Submit ────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.honeypot) return;
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Scroll to first error
      setTimeout(() => {
        document.querySelector("[data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
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
          pickupDate: form.eventDate,
          pickupTime: null,
          fulfillmentType: form.fulfillment,
          deliveryAddress:
            form.fulfillment === "delivery"
              ? `${form.deliveryAddress}, ${form.deliveryZip}`
              : null,
          quantity: qty,
          flavor,
          icingColors: [frostingType],
          topper: hasTopper,
          topperDescription: topperDesc || null,
          sprinklesOrGlitter: null,
          notes: [frostingColorNote ? `Frosting colours: ${frostingColorNote}` : "", form.notes || ""].filter(Boolean).join("\n\n") || null,
          referenceImageUrl: imageUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setReferenceNumber(data.referenceNumber);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) return <SuccessScreen referenceNumber={referenceNumber} />;

  // ── Summary items ─────────────────────────────────────────

  const summaryItems = [
    { label: "Quantity", value: `${qty} cupcakes`, price: `$${PRICES[qty]}` },
    { label: "Flavour", value: FLAVOR_LABELS[flavor] ?? flavor },
    { label: "Frosting", value: FROSTING_LABELS[frostingType] ?? frostingType },
    ...(frostingColorNote
      ? [{ label: "Colours", value: frostingColorNote }]
      : []),
    {
      label: "Topper",
      value: TOPPER_LABELS[topperDesc] ?? topperDesc,
    },
    ...(form.fulfillment === "delivery"
      ? [{ label: "Delivery", value: "Austin delivery", price: `+$${ADDON_DELIVERY}` }]
      : []),
  ];

  // ── Render ────────────────────────────────────────────────

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

      {/* ── Order summary ──────────────────────────────────── */}
      <section
        className="rounded-3xl p-7 space-y-4"
        style={{ backgroundColor: "#F5F0E8", border: "1px solid #E8DDD4" }}
      >
        <h2 className="font-eb-garamond text-2xl" style={{ color: "#4A2545" }}>
          Your cupcake ✦
        </h2>
        <ul className="space-y-2">
          {summaryItems.map(({ label, value, price }) => (
            <li key={label} className="flex items-baseline justify-between gap-4">
              <span className="font-eb-garamond italic text-sm opacity-50" style={{ color: "#7A4A6E" }}>
                {label}
              </span>
              <span className="flex items-center gap-3">
                <span className="font-eb-garamond text-base" style={{ color: "#4A2545" }}>
                  {value}
                </span>
                {price && (
                  <span className="font-eb-garamond text-sm" style={{ color: "#D4788E" }}>
                    {price}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <div
          className="mt-4 pt-4 flex items-baseline justify-between"
          style={{ borderTop: "1px dashed #C4AED8" }}
        >
          <span className="font-eb-garamond text-sm opacity-60" style={{ color: "#7A4A6E" }}>
            Estimated total
          </span>
          <span className="font-eb-garamond italic font-medium text-4xl" style={{ color: "#D4788E" }}>
            ${total}
          </span>
        </div>
        <p className="font-eb-garamond italic text-xs opacity-50 text-center" style={{ color: "#7A4A6E" }}>
          Jo will confirm the final price in her reply
        </p>
      </section>

      {/* ── Lead time notice ────────────────────────────────── */}
      <div
        className="rounded-2xl px-5 py-3 text-center"
        style={{ backgroundColor: "#F2C9A8", border: "1px solid #E8C4A0" }}
      >
        <p className="font-eb-garamond italic text-sm" style={{ color: "#4A2545" }}>
          72 hours minimum · 1 week for 24 or more cupcakes
        </p>
      </div>

      {/* ── Contact details ────────────────────────────────── */}
      <section className="space-y-5">
        <SectionHeading>Your details</SectionHeading>
        <div className="grid md:grid-cols-2 gap-4">
          <Field id="field-name" label="Name" required error={errors.name}>
            <input
              id="field-name"
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Your full name"
              className={inputCls(!!errors.name)}
            />
          </Field>
          <Field id="field-email" label="Email" required error={errors.email}>
            <input
              id="field-email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
              className={inputCls(!!errors.email)}
            />
          </Field>
          <Field id="field-phone" label="Phone" required error={errors.phone}>
            <input
              id="field-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="(512) 555-0100"
              className={inputCls(!!errors.phone)}
            />
          </Field>
        </div>
      </section>

      <WcDivider />

      {/* ── Event date + fulfillment ───────────────────────── */}
      <section className="space-y-5">
        <SectionHeading>When&apos;s the big day?</SectionHeading>

        {/* Pickup / delivery */}
        <div className="grid grid-cols-2 gap-4">
          {(["pickup", "delivery"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => set("fulfillment", type)}
              className="rounded-2xl px-4 py-4 flex flex-col items-center gap-1 transition-all"
              style={{
                backgroundColor: form.fulfillment === type ? "#FAF7F2" : "transparent",
                border: form.fulfillment === type ? "2px solid #D4788E" : "2px solid #E8DDD4",
                boxShadow: form.fulfillment === type ? "0 2px 12px rgba(212,120,142,0.15)" : "none",
              }}
            >
              <span className="font-eb-garamond text-lg capitalize" style={{ color: "#4A2545" }}>
                {type}
              </span>
              <span className="font-eb-garamond italic text-xs opacity-60" style={{ color: "#7A4A6E" }}>
                {type === "delivery"
                  ? `+$${ADDON_DELIVERY} · Austin ISD only`
                  : "Free · address sent on confirmation"}
              </span>
            </button>
          ))}
        </div>

        {/* Delivery address */}
        {form.fulfillment === "delivery" && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Field id="field-address" label="Street address" required error={errors.deliveryAddress}>
                <input
                  id="field-address"
                  type="text"
                  value={form.deliveryAddress}
                  onChange={(e) => set("deliveryAddress", e.target.value)}
                  placeholder="1234 Bluebonnet Dr, Austin"
                  className={inputCls(!!errors.deliveryAddress)}
                />
              </Field>
            </div>
            <Field id="field-zip" label="ZIP code" required error={errors.deliveryZip}>
              <input
                id="field-zip"
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
        <Field id="field-date" label="Event / pick-up date" required error={errors.eventDate}>
          <input
            id="field-date"
            type="date"
            value={form.eventDate}
            min={todayStr}
            onChange={(e) => set("eventDate", e.target.value)}
            className={inputCls(!!errors.eventDate)}
          />
        </Field>
      </section>

      <WcDivider />

      {/* ── Special requests ───────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeading>Special requests</SectionHeading>
        <p className="font-eb-garamond italic text-sm opacity-60" style={{ color: "#7A4A6E" }}>
          Allergies, specific colours, a message on the box — anything goes.
        </p>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="e.g. nut allergy, all pink please, can you write 'Happy 5th Mia' on the box..."
          rows={4}
          className={`${inputCls(false)} resize-none`}
        />
      </section>

      <WcDivider />

      {/* ── Reference image ────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeading>Reference image</SectionHeading>
        <p className="font-eb-garamond italic text-sm opacity-60" style={{ color: "#7A4A6E" }}>
          Got inspo? A party theme, a character, a vibe — upload a pic and Jo will
          match the magic. Optional.
        </p>

        {imagePreview ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Reference preview"
              className="max-h-48 rounded-2xl object-cover"
              style={{ border: "2px solid #E8DDD4" }}
            />
            {imageUploading && (
              <div
                className="absolute inset-0 flex items-center justify-center rounded-2xl"
                style={{ backgroundColor: "rgba(250,247,242,0.8)" }}
              >
                <span className="font-eb-garamond text-sm" style={{ color: "#D4788E" }}>
                  Uploading…
                </span>
              </div>
            )}
            {!imageUploading && (
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-opacity hover:opacity-80"
                style={{ backgroundColor: "#D4788E", color: "white" }}
                aria-label="Remove image"
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-2xl py-10 flex flex-col items-center gap-2 transition-colors"
            style={{
              border: "2px dashed #C4AED8",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(196,174,216,0.08)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <span className="text-3xl opacity-60">🖼</span>
            <span className="font-eb-garamond text-base" style={{ color: "#7A4A6E" }}>
              Click to upload an image
            </span>
            <span
              className="font-eb-garamond italic text-xs opacity-50"
              style={{ color: "#7A4A6E" }}
            >
              JPG, PNG, WEBP · up to 10 MB
            </span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
          aria-label="Upload reference image"
        />

        {imageError && (
          <p className="font-eb-garamond italic text-sm" style={{ color: "#C0392B" }}>
            {imageError}
          </p>
        )}
        {!imageUploading && imageUrl && (
          <p className="font-eb-garamond italic text-sm" style={{ color: "#6B9C6B" }}>
            ✓ Image uploaded
          </p>
        )}
      </section>

      {/* ── Form-level error ───────────────────────────────── */}
      {errors.form && (
        <div
          className="rounded-2xl px-5 py-4 text-center"
          style={{ backgroundColor: "#FDE8E8", border: "1px solid #E8BABA" }}
        >
          <p className="font-eb-garamond italic text-sm" style={{ color: "#8B2020" }}>
            {errors.form}
          </p>
        </div>
      )}

      {/* ── Submit ─────────────────────────────────────────── */}
      <div className="text-center pt-2">
        <button
          type="submit"
          disabled={submitting || imageUploading}
          className="font-eb-garamond text-xl px-12 py-4 rounded-pill transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "#D4788E",
            color: "white",
            boxShadow: "0 4px 16px rgba(212,120,142,0.35)",
          }}
        >
          {submitting ? "Sending…" : "✦ Send my order to Jo"}
        </button>
        <p
          className="font-eb-garamond italic text-sm mt-4 opacity-60"
          style={{ color: "#7A4A6E" }}
        >
          Jo will reply within a day with confirmation and final price.
        </p>
      </div>
    </form>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-eb-garamond text-2xl font-medium" style={{ color: "#4A2545" }}>
      {children}
    </h2>
  );
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block space-y-1.5" {...(error ? { "data-error": true } : {})}>
      <label htmlFor={id} className="font-eb-garamond text-sm block" style={{ color: "#7A4A6E" }}>
        {label}
        {required && (
          <span style={{ color: "#D4788E" }} className="ml-1">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <span
          className="block font-eb-garamond italic text-sm mt-1"
          style={{ color: "#C0392B" }}
        >
          {error}
        </span>
      )}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return [
    "w-full rounded-xl px-4 py-2.5 font-eb-garamond italic placeholder:opacity-40 outline-none transition-colors",
    "border-2",
    hasError ? "border-red-400" : "border-[#E8DDD4] focus:border-[#D4788E]",
    "bg-white",
  ]
    .filter(Boolean)
    .join(" ");
}

function WcDivider() {
  return (
    <div
      className="w-full h-px"
      style={{ background: "linear-gradient(90deg, transparent, #C4AED8 30%, #D4788E 50%, #C4AED8 70%, transparent)" }}
    />
  );
}

function SuccessScreen({ referenceNumber }: { referenceNumber: string }) {
  return (
    <div
      className="rounded-3xl p-10 text-center space-y-6 max-w-lg mx-auto"
      style={{ backgroundColor: "#F5F0E8", border: "1px solid #E8DDD4" }}
    >
      <div className="text-5xl">✦</div>
      <h2
        className="font-eb-garamond italic font-medium leading-tight"
        style={{ fontSize: "clamp(2rem, 5vw, 3rem)", color: "#4A2545" }}
      >
        Your wish is on its way
      </h2>
      <div
        className="rounded-2xl px-6 py-5"
        style={{ backgroundColor: "#FAF7F2", border: "1px dashed #C4AED8" }}
      >
        <p className="font-eb-garamond text-sm opacity-60 mb-1" style={{ color: "#7A4A6E" }}>
          Reference number
        </p>
        <p className="font-eb-garamond italic text-4xl font-medium" style={{ color: "#D4788E" }}>
          {referenceNumber}
        </p>
      </div>
      <p
        className="font-eb-garamond text-lg leading-relaxed opacity-80"
        style={{ color: "#7A4A6E" }}
      >
        Jo will write back within a day with your final price and pickup details.
        Keep an eye on your inbox — and check spam, just in case.
      </p>
      <Link
        href="/"
        className="inline-block font-eb-garamond text-lg px-8 py-3 rounded-pill transition-opacity hover:opacity-80"
        style={{ backgroundColor: "#D4788E", color: "white" }}
      >
        Back to the beginning
      </Link>
    </div>
  );
}
