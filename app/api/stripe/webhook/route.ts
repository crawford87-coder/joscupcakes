import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { sendConfirmationEmail, NewOrderEmailPayload } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      console.error("No orderId in Stripe session metadata");
      return NextResponse.json({ received: true });
    }

    const supabase = createServiceClient();

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      console.error("Order not found for Stripe session:", orderId);
      return NextResponse.json({ received: true });
    }

    await supabase
      .from("orders")
      .update({ status: "confirmed" })
      .eq("id", orderId);

    try {
      const emailPayload: NewOrderEmailPayload = {
        referenceNumber: order.reference_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        quantity: order.quantity,
        flavor: order.flavor,
        icingColors: order.icing_colors ?? [],
        topperDescription: order.topper_description,
        sprinklesOrGlitter: order.sprinkles_or_glitter,
        pickupDate: order.pickup_date,
        fulfillmentType: order.fulfillment_type,
        deliveryAddress: order.delivery_address,
        notes: order.notes,
        totalPrice: order.total_price,
      };
      await sendConfirmationEmail(emailPayload);
    } catch (emailErr) {
      console.error("Confirmation email error after payment:", emailErr);
    }
  }

  return NextResponse.json({ received: true });
}
