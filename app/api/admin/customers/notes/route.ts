import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { email, notes, address, child_name, birthday_month } = body;

  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  const { error } = await supabase
    .from("customer_notes")
    .upsert(
      { email, notes, address, child_name, birthday_month, updated_at: new Date().toISOString() },
      { onConflict: "email" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
