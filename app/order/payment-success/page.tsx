import Link from "next/link";

export const metadata = { title: "Payment received — Jo's Cupcakes" };

export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { ref?: string };
}) {
  return (
    <div className="max-w-lg mx-auto px-6 py-24 text-center">
      <p className="text-5xl mb-6">🎂</p>
      <h1 className="font-eb-garamond italic text-tp-primary text-4xl font-medium mb-4">
        Payment received!
      </h1>
      <p className="font-eb-garamond italic text-plum text-lg leading-relaxed mb-2">
        Thank you{searchParams.ref ? ` for order ${searchParams.ref}` : ""}. Jo
        will be in touch shortly with your confirmation and all the details.
      </p>
      <p className="font-eb-garamond italic text-tp-muted text-base leading-relaxed mb-10">
        Check your inbox — a confirmation email is on its way.
      </p>
      <Link href="/" className="btn-primary">
        ✦ Back to home
      </Link>
    </div>
  );
}
