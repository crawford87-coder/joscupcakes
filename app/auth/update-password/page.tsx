"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkle } from "@/components/Decorative";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Supabase puts the recovery session in the URL hash — listen for it
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) { setError("Could not update password. Please try again."); return; }
    setSuccess(true);
    setTimeout(() => { window.location.href = "/admin/login"; }, 2500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card w-full max-w-sm space-y-6">
        <div className="text-center">
          <Sparkle size={16} className="text-rose-light mx-auto mb-3" />
          <h1 className="font-cormorant italic text-berry text-3xl font-medium">
            Set new password
          </h1>
        </div>

        {success ? (
          <div className="text-center space-y-2">
            <p className="text-3xl">✓</p>
            <p className="font-im-fell italic text-plum">Password updated! Redirecting to login…</p>
          </div>
        ) : !ready ? (
          <p className="font-im-fell italic text-plum/60 text-sm text-center">
            Verifying your reset link…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="font-im-fell-sc text-plum text-sm">New password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                autoComplete="new-password"
                className="w-full rounded-xl border-2 border-border-pink px-4 py-2.5 font-im-fell italic text-plum bg-white outline-none focus:border-rose"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="font-im-fell-sc text-plum text-sm">Confirm password</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full rounded-xl border-2 border-border-pink px-4 py-2.5 font-im-fell italic text-plum bg-white outline-none focus:border-rose"
              />
            </label>
            {error && <p className="font-im-fell italic text-red-600 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Saving…" : "Save new password →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
