import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReferenceNumber, calculateTotal } from "@/lib/pricing";
import { sendNewOrderEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      customerName,
      customerEmail,
      customerPhone,
      pickupDate,
      pickupTime,
      fulfillmentType,
      deliveryAddress,
      quantity,
      flavor,
      icingColors,
      topper,
      topperDescription,
      sprinklesOrGlitter,
      notes,
    } = body;

    // Basic server-side validation
    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !pickupDate ||
      !fulfillmentType ||
      !quantity ||
      !flavor
    ) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Re-derive total server-side — never trust client total
    const totalPrice = calculateTotal({
      quantity: Number(quantity),
      topper: Boolean(topper),
      hasExtras: !!sprinklesOrGlitter,
      delivery: fulfillmentType === "delivery",
    });

    const referenceNumber = generateReferenceNumber();

    const supabase = createClient();
    const { error: dbError } = await supabase.from("orders").insert({
      reference_number: referenceNumber,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      pickup_date: pickupDate,
      fulfillment_type: fulfillmentType,
      delivery_address: deliveryAddress ?? null,
      quantity: Number(quantity),
      flavor,
      icing_colors: icingColors ?? [],
      topper: Boolean(topper),
      topper_description: topperDescription ?? null,
      sprinkles_or_glitter: sprinklesOrGlitter ?? null,
      notes: notes ?? null,
      pickup_time: pickupTime ?? null,
      total_price: totalPrice,
      status: "new",
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
      return NextResponse.json({ error: "Failed to save order." }, { status: 500 });
    }

    // Send email notification to Jo (non-fatal — don't fail the order if email fails)
    try {
      await sendNewOrderEmail({
        referenceNumber,
        customerName,
        customerEmail,
        customerPhone,
        quantity: Number(quantity),
        flavor,
        icingColors: icingColors ?? [],
        topperDescription: topperDescription ?? null,
        sprinklesOrGlitter: sprinklesOrGlitter ?? null,
        pickupDate,
        fulfillmentType,
        deliveryAddress: deliveryAddress ?? null,
        notes: notes ?? null,
        totalPrice,
      });
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
    }

    return NextResponse.json({ referenceNumber }, { status: 201 });
  } catch (err) {
    console.error("Order API error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
