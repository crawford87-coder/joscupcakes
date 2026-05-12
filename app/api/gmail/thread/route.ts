import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccessToken, getThread, searchThreadForOrder } from "@/lib/gmail";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

  const { data: order } = await supabase
    .from("orders")
    .select("id, reference_number, customer_email, gmail_thread_id")
    .eq("id", orderId)
    .single();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  let threadId = (order.gmail_thread_id as string | null) ?? null;

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch {
    return NextResponse.json({ messages: [], threadId: null, gmailNotConnected: true });
  }

  // Auto-discover thread via Gmail search if not yet linked
  if (!threadId) {
    try {
      threadId = await searchThreadForOrder(
        accessToken,
        order.reference_number as string
      );
      if (threadId) {
        await supabase.from("orders").update({ gmail_thread_id: threadId }).eq("id", orderId);
      }
    } catch {
      // Search failure is non-fatal
    }
  }

  if (!threadId) {
    return NextResponse.json({ messages: [], threadId: null });
  }

  try {
    const messages = await getThread(accessToken, threadId);
    return NextResponse.json({ messages, threadId });
  } catch (err) {
    console.error("Gmail thread fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch thread" }, { status: 500 });
  }
}
