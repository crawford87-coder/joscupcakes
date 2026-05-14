"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminSettingsPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("Could not update password. Please try again.");
      return;
    }

    setSuccess(true);
    setPassword("");
    setConfirm("");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      <h1 className="font-cormorant italic text-berry text-3xl font-medium">Settings</h1>

      <div className="card max-w-sm space-y-5">
        <div>
          <h2 className="font-im-fell-sc text-plum text-base tracking-wide">Change password</h2>
          <p className="font-im-fell italic text-plum/60 text-sm mt-1">
            Set a password so you can log in without a magic link.
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="font-im-fell-sc text-plum text-sm">New password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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

          {error && (
            <p className="font-im-fell italic text-red-600 text-sm">{error}</p>
          )}
          {success && (
            <p className="font-im-fell italic text-green-700 text-sm">Password updated! You can now log in with email + password.</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Saving…" : "Save password →"}
          </button>
        </form>
      </div>
    </div>
  );
}
