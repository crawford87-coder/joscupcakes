import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccessToken, sendEmail } from "@/lib/gmail";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    orderId,
    to,
    subject,
    htmlBody,
    threadId,
    inReplyTo,
    references,
  } = await req.json();

  if (!to || !subject || !htmlBody) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch {
    return NextResponse.json({ error: "Gmail not connected" }, { status: 503 });
  }

  const result = await sendEmail(accessToken, {
    to,
    subject,
    htmlBody,
    threadId,
    inReplyTo,
    references,
  });

  // Store thread ID back to order on first send
  if (orderId && result.threadId) {
    await supabase
      .from("orders")
      .update({ gmail_thread_id: result.threadId })
      .eq("id", orderId)
      .is("gmail_thread_id", null);
  }

  return NextResponse.json(result);
}
