import nodemailer from "nodemailer";

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error("GMAIL_USER or GMAIL_APP_PASSWORD is not set");
  return nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
}

// ─── HTML helpers ─────────────────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#FAF7F2;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF7F2;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr>
        <td align="center" style="padding:0 0 20px 0;">
          <p style="margin:0;font-family:Georgia,serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#9B8B82;">Custom cupcakes · Austin, TX</p>
          <h1 style="margin:8px 0 0 0;font-family:Georgia,serif;font-size:32px;font-weight:normal;color:#3D2B1F;letter-spacing:0.04em;">✦ Jo's Cupcakes ✦</h1>
        </td>
      </tr>
      <tr><td style="padding:0 0 24px 0;"><div style="height:1px;background:linear-gradient(to right,#FAF7F2,#D4788E,#FAF7F2);"></div></td></tr>
      <tr>
        <td style="background:#FFFFFF;border-radius:12px;padding:40px;box-shadow:0 4px 32px rgba(107,92,82,0.10);">
          ${content}
        </td>
      </tr>
      <tr><td align="center" style="padding:24px 0 0 0;">
        <p style="margin:0;font-family:Georgia,serif;font-size:12px;color:#9B8B82;">Questions? Just reply to this email.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function orderBlock(fields: Array<[string, string | null | undefined]>): string {
  const rows = fields
    .filter(([, v]) => v)
    .map(([label, value]) => `<tr>
      <td style="padding:10px 16px;border-bottom:1px solid #F5F0E8;">
        <p style="margin:0 0 2px 0;font-family:Georgia,serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#9B8B82;">${label}</p>
        <p style="margin:0;font-family:Georgia,serif;font-size:15px;color:#3D2B1F;">${value}</p>
      </td></tr>`)
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EDE8E0;border-radius:8px;margin:24px 0;background:#FAF7F2;overflow:hidden;">${rows}</table>`;
}

function ctaButton(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:28px 0;"><tr>
    <td style="background-color:#D4788E;border-radius:8px;">
      <a href="${url}" style="display:inline-block;padding:14px 40px;font-family:Georgia,serif;font-size:15px;letter-spacing:0.06em;color:#FFFFFF;text-decoration:none;">${text}</a>
    </td></tr></table>`;
}

function sig(): string {
  return `<p style="margin:32px 0 4px 0;font-family:Georgia,serif;font-size:16px;color:#3D2B1F;">With love,</p>
<p style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:normal;color:#D4788E;">— Jo</p>`;
}

function p(text: string, extra = ""): string {
  return `<p style="margin:0 0 16px 0;font-family:Georgia,serif;font-size:16px;line-height:1.75;color:#3D2B1F;${extra}">${text}</p>`;
}

function h2(text: string): string {
  return `<h2 style="margin:0 0 20px 0;font-family:Georgia,serif;font-size:22px;font-weight:normal;color:#3D2B1F;">${text}</h2>`;
}

// ─── Types ────────────────────────────────────────────────────────────────

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

// ─── 1. New order alert (to Jo) ───────────────────────────────────────────

export async function sendNewOrderEmail(order: NewOrderEmailPayload) {
  const joEmail = process.env.JO_EMAIL ?? "jo@jocrawford.me";
  const fromEmail = process.env.GMAIL_USER ?? "jo@jocrawford.me";
  const adminUrl = `${process.env.SITE_URL ?? "https://joscupcakes.com"}/admin`;

  const html = emailWrapper(`
    ${h2("A new wish just came in 🎂")}
    ${p(`<strong>${order.customerName}</strong> placed an order and is waiting for your review.`)}
    ${orderBlock([
      ["Reference", order.referenceNumber],
      ["Cupcakes", `${order.quantity} ${order.flavor}`],
      ["Icing colors", order.icingColors.join(", ") || "none specified"],
      ["Topper", order.topperDescription],
      ["Extras", order.sprinklesOrGlitter],
      ["Pickup date", order.pickupDate],
      ["Fulfillment", order.fulfillmentType === "delivery" ? `Delivery → ${order.deliveryAddress}` : "Pickup"],
      ["Notes", order.notes],
      ["Total", `$${order.totalPrice}`],
      ["Customer", `${order.customerName} · ${order.customerEmail} · ${order.customerPhone}`],
    ])}
    ${ctaButton("Review order in admin →", adminUrl)}
    <p style="margin:0;font-family:Georgia,serif;font-size:13px;color:#9B8B82;">This is an internal notification. The customer has not yet been contacted.</p>
  `);

  await getTransporter().sendMail({
    from: fromEmail,
    to: joEmail,
    subject: `New wish: ${order.referenceNumber} — ${order.customerName}`,
    html,
    text: `New order from ${order.customerName}: ${order.referenceNumber}\n${order.quantity} ${order.flavor} cupcakes · $${order.totalPrice}\nReview: ${adminUrl}`,
  });
}

// ─── 2. Confirmation email (to customer, after payment) ───────────────────

export async function sendConfirmationEmail(order: NewOrderEmailPayload) {
  const fromEmail = process.env.GMAIL_USER ?? "jo@jocrawford.me";

  const deadline = new Date(new Date(order.pickupDate).getTime() - 48 * 60 * 60 * 1000)
    .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const formattedPickup = new Date(order.pickupDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  const html = emailWrapper(`
    ${h2("Your wish is granted ✦")}
    ${p(`Hi ${order.customerName},`)}
    ${p("Payment received — your order is confirmed and on my calendar. Here's everything:")}
    ${orderBlock([
      ["Cupcakes", `${order.quantity} ${order.flavor}`],
      ["Icing colors", order.icingColors.join(", ") || "none specified"],
      ["Topper", order.topperDescription],
      ["Extras", order.sprinklesOrGlitter],
      ["Pickup date", formattedPickup],
      ["Fulfillment", order.fulfillmentType === "delivery" ? `Delivery to ${order.deliveryAddress}` : "Pickup (address to follow)"],
      ["Total paid", `$${order.totalPrice}`],
      ["Reference", order.referenceNumber],
    ])}
    ${p(`I'll be in touch closer to your date with pickup details. If anything needs to change, just reply to this email — I'm flexible as long as it's before ${deadline}.`)}
    ${sig()}
  `);

  await getTransporter().sendMail({
    from: fromEmail,
    to: order.customerEmail,
    subject: `Your wish is granted ✦ ${order.referenceNumber}`,
    html,
    text: `Hi ${order.customerName},\n\nYour order is confirmed!\n\n${order.quantity} ${order.flavor} cupcakes\nPickup: ${formattedPickup}\nTotal: $${order.totalPrice}\nRef: ${order.referenceNumber}\n\n— Jo`,
  });
}

// ─── 3. Birthday reminder (to returning customers) ────────────────────────

export interface ReminderEmailPayload {
  customerName: string;
  customerEmail: string;
  childName: string | null;
  birthdayMonth: string;
  lastOrderYear: number;
  lastOrderFlavor: string;
  lastOrderQuantity: number;
  orderLink: string;
}

export async function sendReminderEmail(payload: ReminderEmailPayload) {
  const fromEmail = process.env.GMAIL_USER ?? "jo@jocrawford.me";
  const childLine = payload.childName ? `${payload.childName}'s` : "the";

  const html = emailWrapper(`
    ${h2(`${payload.birthdayMonth} is coming 🎂`)}
    ${p(`Hi ${payload.customerName},`)}
    ${p(`It's almost ${payload.birthdayMonth} and I was just thinking about you!`)}
    ${p(`Last year you ordered ${payload.lastOrderQuantity} ${payload.lastOrderFlavor} cupcakes for ${childLine} birthday — they were so lovely to make.`)}
    ${p(`Is that time of year coming around again? I'd love to bake something special${payload.childName ? ` for ${payload.childName}` : ""} — I'm already getting booked up for ${payload.birthdayMonth}, so the sooner the better.`)}
    ${ctaButton("Start your order →", payload.orderLink)}
    ${p("Can't wait to hear what magic you'd like this time.", "margin-top:8px;")}
    ${sig()}
  `);

  await getTransporter().sendMail({
    from: fromEmail,
    to: payload.customerEmail,
    subject: `${payload.birthdayMonth} is coming — ready to order cupcakes again? 🎂`,
    html,
    text: `Hi ${payload.customerName},\n\nIt's almost ${payload.birthdayMonth}! Last year you ordered ${payload.lastOrderQuantity} ${payload.lastOrderFlavor} cupcakes for ${childLine} birthday.\n\nReady to order again? ${payload.orderLink}\n\n— Jo`,
  });
}

// ─── 4. Payment request (to customer) ────────────────────────────────────

export async function sendPaymentRequestEmail({
  customerName,
  customerEmail,
  referenceNumber,
  quantity,
  flavor,
  totalPrice,
  depositAmount,
  isDeposit,
  paymentUrl,
  pickupDate,
}: {
  customerName: string;
  customerEmail: string;
  referenceNumber: string;
  quantity: number;
  flavor: string;
  totalPrice: number;
  depositAmount: number;
  isDeposit: boolean;
  paymentUrl: string;
  pickupDate: string;
}) {
  const fromEmail = process.env.GMAIL_USER ?? "jo@jocrawford.me";
  const amountDue = isDeposit ? depositAmount : totalPrice;
  const formattedPickup = new Date(pickupDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  const paymentNote = isDeposit
    ? `50% deposit due now: <strong>$${depositAmount}</strong><br><span style="font-size:13px;color:#9B8B82;">Remaining $${totalPrice - depositAmount} due 24 hours before pickup</span>`
    : `Amount due: <strong>$${totalPrice}</strong>`;

  const html = emailWrapper(`
    ${h2("Your order is ready ✦")}
    ${p(`Hi ${customerName},`)}
    ${p("I've reviewed your order and I'm so excited to get baking! Here's what I have for you:")}
    ${orderBlock([
      ["Cupcakes", `${quantity} ${flavor}`],
      ["Pickup date", formattedPickup],
      ["Order total", `$${totalPrice}`],
    ])}
    <p style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:16px;color:#3D2B1F;">${paymentNote}</p>
    <p style="margin:0 0 4px 0;font-family:Georgia,serif;font-size:15px;color:#6B5C52;">To hold your spot, complete your payment below. Once it goes through, I'll send a confirmation with everything locked in.</p>
    ${ctaButton("Complete payment →", paymentUrl)}
    <p style="margin:-12px 0 16px 0;font-family:Georgia,serif;font-size:13px;color:#9B8B82;">If the button doesn't work, copy this link into your browser:<br>${paymentUrl}</p>
    ${p("Any questions? Just reply to this email.")}
    ${sig()}
    <p style="margin:16px 0 0 0;font-family:Georgia,serif;font-size:12px;color:#9B8B82;">Reference: ${referenceNumber}</p>
  `);

  await getTransporter().sendMail({
    from: fromEmail,
    to: customerEmail,
    subject: `Your order is ready — complete your payment ✦ ${referenceNumber}`,
    html,
    text: `Hi ${customerName},\n\nYour order is ready!\n\n${quantity} ${flavor} cupcakes\nPickup: ${formattedPickup}\nAmount due: $${amountDue}${isDeposit ? ` (50% deposit — remaining $${totalPrice - depositAmount} due 24h before pickup)` : ""}\n\nPay here: ${paymentUrl}\n\nRef: ${referenceNumber}\n\n— Jo`,
  });
}
