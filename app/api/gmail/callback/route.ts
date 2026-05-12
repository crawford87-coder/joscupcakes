import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", req.url));

  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/admin?gmail_error=1", req.url));
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();
  if (!tokenRes.ok) {
    console.error("Gmail token exchange failed:", tokens);
    return NextResponse.redirect(new URL("/admin?gmail_error=1", req.url));
  }

  // Fetch Gmail account email
  const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const info = await infoRes.json();

  await supabase.from("gmail_credentials").upsert({
    id: 1,
    email: info.email ?? process.env.GMAIL_USER,
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token,
    token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });

  return NextResponse.redirect(new URL("/admin?gmail_connected=1", req.url));
}
