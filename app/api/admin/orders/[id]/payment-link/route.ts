import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { sendPaymentRequestEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!["new", "awaiting_payment"].includes(order.status)) {
    return NextResponse.json(
      { error: "Payment link can only be sent for new orders" },
      { status: 400 }
    );
  }

  const origin = req.nextUrl.origin;
  const totalPrice = Number(order.total_price);

  // Orders over $80 → 50% deposit; under $80 → full payment
  const isDeposit = totalPrice > 80;
  const depositAmount = isDeposit ? Math.ceil(totalPrice * 0.5) : totalPrice;
  const amountInCents = depositAmount * 100;

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: order.customer_email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountInCents,
          product_data: {
            name: isDeposit
              ? `50% deposit — ${order.quantity} ${order.flavor} cupcakes (${order.reference_number})`
              : `${order.quantity} ${order.flavor} cupcakes (${order.reference_number})`,
            description: isDeposit
              ? `Deposit to hold your order. Remaining $${totalPrice - depositAmount} due 24 hours before pickup.`
              : `Full payment for your cupcake order.`,
          },
        },
      },
    ],
    metadata: {
      orderId: order.id,
      referenceNumber: order.reference_number,
    },
    success_url: `${origin}/order/payment-success?ref=${order.reference_number}`,
    cancel_url: `${origin}/order/payment-cancelled?ref=${order.reference_number}`,
  });

  // Update order with session ID and status
  await supabase
    .from("orders")
    .update({ stripe_session_id: checkoutSession.id, status: "awaiting_payment" })
    .eq("id", order.id);

  // Email the customer the payment link
  try {
    await sendPaymentRequestEmail({
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      referenceNumber: order.reference_number,
      quantity: order.quantity,
      flavor: order.flavor,
      totalPrice,
      depositAmount,
      isDeposit,
      paymentUrl: checkoutSession.url!,
      pickupDate: order.pickup_date,
    });
  } catch (emailErr) {
    console.error("Payment request email error:", emailErr);
  }

  return NextResponse.json({ url: checkoutSession.url });
}
