"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkle } from "@/components/Decorative";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (otpError) {
      setError("Could not send link. Check the email address and try again.");
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
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

        {sent ? (
          <div className="text-center space-y-3">
            <p className="text-3xl">✉️</p>
            <p className="font-im-fell italic text-plum text-base">
              Check <strong>{email}</strong> for a sign-in link.
            </p>
            <p className="font-im-fell italic text-plum/60 text-sm">
              Click the link in the email and you&apos;ll be taken straight to the admin panel.
            </p>
            <button
              type="button"
              onClick={() => { setSent(false); setEmail(""); }}
              className="font-im-fell italic text-plum/50 text-sm hover:text-plum/80 transition-colors"
            >
              ← Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendLink} className="space-y-4">
            <p className="font-im-fell italic text-plum/70 text-sm text-center">
              Enter your email and we&apos;ll send you a sign-in link.
            </p>
            <label className="block space-y-1.5">
              <span className="font-im-fell-sc text-plum text-sm">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
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
              {loading ? "Sending…" : "Send sign-in link →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
