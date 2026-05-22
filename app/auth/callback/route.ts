import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

function getBaseUrl(req: NextRequest) {
  const configuredSiteUrl = process.env.SITE_URL?.trim();
  if (configuredSiteUrl && /^https?:\/\//i.test(configuredSiteUrl)) {
    return configuredSiteUrl.replace(/\/$/, "");
  }

  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    return `${forwardedProto ?? "https"}://${forwardedHost}`;
  }

  const host = req.headers.get("host");
  if (host) {
    const proto = req.nextUrl.protocol.replace(/:$/, "") || "https";
    return `${proto}://${host}`;
  }

  return req.nextUrl.origin;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const baseUrl = getBaseUrl(req);
  const code = searchParams.get("code");

  if (code) {
    const res = NextResponse.redirect(`${baseUrl}/admin`);
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return res;
  }

  // Something went wrong — send back to login
  return NextResponse.redirect(`${baseUrl}/admin/login?error=auth`);
}
