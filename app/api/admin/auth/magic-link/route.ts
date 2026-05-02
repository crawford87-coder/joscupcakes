import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getAllowedAdminEmails() {
  const configuredEmails = process.env.ADMIN_ALLOWED_EMAILS ?? process.env.JO_EMAIL ?? "";
  return new Set(
    configuredEmails
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
}

function getBaseUrl(req: NextRequest) {
  const configuredSiteUrl = process.env.SITE_URL?.trim();
  if (configuredSiteUrl && /^https?:\/\//i.test(configuredSiteUrl)) {
    return configuredSiteUrl.replace(/\/$/, "");
  }

  return req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const allowedAdminEmails = getAllowedAdminEmails();

  if (!allowedAdminEmails.size) {
    return NextResponse.json(
      { error: "Admin email allowlist is not configured." },
      { status: 500 }
    );
  }

  if (!allowedAdminEmails.has(email)) {
    return NextResponse.json(
      { error: "This email is not allowed for admin access." },
      { status: 403 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase auth is not configured." },
      { status: 500 }
    );
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${getBaseUrl(req)}/auth/callback`,
    },
  });

  if (error) {
    const message = error.status === 429
      ? "Too many sign-in attempts. Please wait a bit and try again."
      : "Could not send link. Check the email address and try again.";

    return NextResponse.json({ error: message }, { status: error.status ?? 500 });
  }

  return NextResponse.json({ ok: true });
}