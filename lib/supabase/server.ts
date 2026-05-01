import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function requireSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value || value.includes("placeholder.supabase.co") || value.includes("your-project.supabase.co")) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL. Set a real Supabase project URL.");
  }
  return value;
}

function requireSupabaseAnonKey() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value || value === "placeholder" || value === "your-supabase-anon-key") {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Set a real Supabase anon key.");
  }
  return value;
}

function requireSupabaseServiceRoleKey() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value || value.startsWith("your-") || value === "placeholder") {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY. Set a real Supabase service role key.");
  }
  return value;
}

/** Service role client — bypasses RLS. Use only in server-side API routes. */
export function createServiceClient() {
  const url = requireSupabaseUrl();
  const key = requireSupabaseServiceRoleKey();
  return createSupabaseClient(url, key);
}

export async function createClient() {
  const cookieStore = await cookies();
  const url = requireSupabaseUrl();
  const key = requireSupabaseAnonKey();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — session refresh handled by middleware
        }
      },
    },
  });
}
