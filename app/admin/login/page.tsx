"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Sparkle } from "@/components/Decorative";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card w-full max-w-sm space-y-6">
        <div className="text-center">
          <Sparkle size={16} className="text-rose-light mx-auto mb-3" />
          <h1 className="font-cormorant italic text-berry text-3xl font-medium">
            Jo&apos;s Cupcakes
          </h1>
          <p className="font-im-fell-sc text-plum/60 text-xs tracking-widest mt-1 uppercase">
            Admin access
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="font-im-fell-sc text-plum text-sm">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border-2 border-border-pink px-4 py-2.5 font-im-fell italic text-plum bg-white outline-none focus:border-rose"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="font-im-fell-sc text-plum text-sm">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border-2 border-border-pink px-4 py-2.5 font-im-fell italic text-plum bg-white outline-none focus:border-rose"
            />
          </label>

          {error && (
            <p className="font-im-fell italic text-red-600 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
