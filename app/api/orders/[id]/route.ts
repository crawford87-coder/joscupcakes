import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendConfirmationEmail, NewOrderEmailPayload } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { status } = body;

  const VALID_STATUSES = ["new", "awaiting_payment", "confirmed", "in_progress", "ready", "delivered", "cancelled"];
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Failed to update order." }, { status: 500 });
  }

  // Send confirmation email when status changes to "confirmed"
  if (status === "confirmed") {
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
      console.error("Confirmation email error:", emailErr);
    }
  }

  return NextResponse.json({ order });
}
