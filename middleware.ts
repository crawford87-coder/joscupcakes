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

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const baseUrl = getBaseUrl(req);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect /admin routes (except /admin/login)
  if (req.nextUrl.pathname.startsWith("/admin") && !req.nextUrl.pathname.startsWith("/admin/login")) {
    if (!session) {
      return NextResponse.redirect(`${baseUrl}/admin/login`);
    }
  }

  // Redirect logged-in users away from login page
  if (req.nextUrl.pathname === "/admin/login" && session) {
    return NextResponse.redirect(`${baseUrl}/admin`);
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
