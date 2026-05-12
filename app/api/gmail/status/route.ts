import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ connected: false });

  const { data } = await supabase
    .from("gmail_credentials")
    .select("email, refresh_token")
    .eq("id", 1)
    .single();

  return NextResponse.json({
    connected: !!(data?.refresh_token),
    email: (data?.email as string) ?? null,
  });
}
