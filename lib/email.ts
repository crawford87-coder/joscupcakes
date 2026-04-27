import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

export interface NewOrderEmailPayload {
  referenceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
  flavor: string;
  icingColors: string[];
  topperDescription: string | null;
  sprinklesOrGlitter: string | null;
  pickupDate: string;
  fulfillmentType: string;
  deliveryAddress: string | null;
  notes: string | null;
  totalPrice: number;
}

export async function sendNewOrderEmail(order: NewOrderEmailPayload) {
  const joEmail = process.env.JO_EMAIL ?? "jo@joscupcakes.com";
  const fromEmail = process.env.ADMIN_EMAIL_FROM ?? "orders@joscupcakes.com";
  const adminUrl = process.env.NEXTAUTH_URL
    ? `${process.env.NEXTAUTH_URL}/admin`
    : "https://joscupcakes.com/admin";

  const body = `A new order just came in.

${order.referenceNumber}
${order.quantity} ${order.flavor} cupcakes
Colors: ${order.icingColors.join(", ") || "none"}
Topper: ${order.topperDescription ?? "none"}
Extras: ${order.sprinklesOrGlitter ?? "none"}
Pickup date: ${order.pickupDate}
Fulfillment: ${order.fulfillmentType}${order.deliveryAddress ? ` — ${order.deliveryAddress}` : ""}
Notes: ${order.notes ?? "none"}
Total: $${order.totalPrice}

From: ${order.customerName} · ${order.customerEmail} · ${order.customerPhone}

Log in to confirm: ${adminUrl}`;

  await getResend().emails.send({
    from: fromEmail,
    to: joEmail,
    subject: `New wish: ${order.referenceNumber} — ${order.customerName}`,
    text: body,
  });
}

export async function sendConfirmationEmail(order: NewOrderEmailPayload) {
  const fromEmail = process.env.ADMIN_EMAIL_FROM ?? "orders@joscupcakes.com";

  // Calculate 48h before pickup for change deadline
  const pickupMs = new Date(order.pickupDate).getTime();
  const deadline = new Date(pickupMs - 48 * 60 * 60 * 1000)
    .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const body = `Hi ${order.customerName},

Your order is confirmed. Here's what's on the way:

${order.quantity} ${order.flavor} cupcakes — $${order.totalPrice}
Colors: ${order.icingColors.join(", ") || "none"}
Topper: ${order.topperDescription ?? "none"}
Extras: ${order.sprinklesOrGlitter ?? "none"}
Pickup date: ${order.pickupDate}
${order.fulfillmentType === "delivery" ? `Delivery to: ${order.deliveryAddress}` : "Pickup: address will follow"}

Payment: Venmo, Zelle, or cash at pickup/delivery.

If anything needs to change, just reply to this email by ${deadline}.

Can't wait to bake these up.

— Jo`;

  await getResend().emails.send({
    from: fromEmail,
    to: order.customerEmail,
    subject: `Your wish is granted ✦ ${order.referenceNumber}`,
    text: body,
  });
}
