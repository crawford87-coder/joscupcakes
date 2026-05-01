import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || url.includes("placeholder.supabase.co") || url.includes("your-project.supabase.co")) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL. Set a real Supabase project URL.");
  }

  if (!key || key === "placeholder" || key === "your-supabase-anon-key") {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Set a real Supabase anon key.");
  }

  return createBrowserClient(url, key);
}
