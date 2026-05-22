import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendAdminReplyEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { to, subject, htmlBody } = await req.json();

  if (!to || !subject || !htmlBody) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await sendAdminReplyEmail({ to, subject, htmlBody });

  return NextResponse.json({ ok: true });
}
