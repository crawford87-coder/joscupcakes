import Link from "next/link";

export const metadata = { title: "Payment cancelled — Jo's Cupcakes" };

export default function PaymentCancelledPage({
  searchParams,
}: {
  searchParams: { ref?: string };
}) {
  return (
    <div className="max-w-lg mx-auto px-6 py-24 text-center">
      <p className="text-5xl mb-6">🌸</p>
      <h1 className="font-eb-garamond italic text-tp-primary text-4xl font-medium mb-4">
        No worries
      </h1>
      <p className="font-eb-garamond text-tp-primary text-lg leading-relaxed mb-2">
        Your order{searchParams.ref ? ` (${searchParams.ref})` : ""} is still
        saved. If you&apos;d like to complete payment or have any questions, just
        reply to Jo&apos;s email and she&apos;ll help you sort it out.
      </p>
      <p className="font-eb-garamond text-tp-muted text-base leading-relaxed mb-10">
        Your spot isn&apos;t confirmed until payment is complete.
      </p>
      <Link href="/" className="btn-primary">
        ✦ Back to home
      </Link>
    </div>
  );
}
