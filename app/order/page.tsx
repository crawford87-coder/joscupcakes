import { Sparkle } from "@/components/Decorative";
import OrderForm from "@/components/OrderForm";

export const metadata = {
  title: "Order — Jo's Cupcakes",
  description:
    "Place a custom cupcake order for your kid's birthday. Tell us the dream — we'll bake the magic.",
};

export default function OrderPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 pb-16 pt-12">
      {/* Header */}
      <div className="text-center mb-10">
        <Sparkle size={14} className="text-rose-light mx-auto mb-3" />
        <h1 className="font-cormorant italic text-berry text-5xl md:text-6xl font-medium mb-3">
          Dream it up
        </h1>
        <p className="font-im-fell italic text-plum text-lg">
          Tell us what magic to bake. We&apos;ll write back within a day.
        </p>
      </div>

      <OrderForm />
    </div>
  );
}
