import { Suspense } from "react";
import OrderFormNew from "@/components/OrderFormNew";

export const metadata = {
  title: "Order — Jo's Cupcakes",
  description:
    "Place a custom cupcake order for your kid's birthday. Tell us the dream — we'll bake the magic.",
};

export default function OrderPage() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#FAF7F2" }}
    >
      {/* Watercolor header */}
      <div
        className="py-16 px-6 text-center relative overflow-hidden"
        style={{ backgroundColor: "#F5F0E8" }}
      >
        <div className="relative z-10 max-w-2xl mx-auto">
          <p
            className="font-caveat text-sm tracking-wide opacity-50 mb-4"
            style={{ color: "#6B5C52" }}
          >
            — the final step —
          </p>
          <h1
            className="font-cormorant italic font-medium leading-tight mb-3"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", color: "#3D2B1F" }}
          >
            Complete your order
          </h1>
          <p
            className="font-im-fell italic text-xl opacity-60"
            style={{ color: "#6B5C52" }}
          >
            Fill in your details below. Jo will write back within a day with confirmation.
          </p>
        </div>
      </div>

      {/* Order form */}
      <div className="max-w-2xl mx-auto px-6 pb-20 pt-10">
        <Suspense
          fallback={
            <div
              className="animate-pulse h-96 rounded-3xl"
              style={{ backgroundColor: "#F5F0E8" }}
            />
          }
        >
          <OrderFormNew />
        </Suspense>
      </div>
    </div>
  );
}

