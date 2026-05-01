import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendReminderEmail } from "@/lib/email";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { email, customerName, childName, birthdayMonth, lastOrderYear, lastOrderFlavor, lastOrderQuantity } = body;

  if (!email || !customerName || !birthdayMonth) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

  try {
    await sendReminderEmail({
      customerName,
      customerEmail: email,
      childName: childName ?? null,
      birthdayMonth: MONTH_NAMES[birthdayMonth - 1] ?? "this month",
      lastOrderYear,
      lastOrderFlavor,
      lastOrderQuantity,
      orderLink: `${siteUrl}/order`,
    });
  } catch {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  // Record when the reminder was sent
  await supabase
    .from("customer_notes")
    .upsert(
      { email, reminder_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { onConflict: "email" }
    );

  return NextResponse.json({ ok: true });
}
