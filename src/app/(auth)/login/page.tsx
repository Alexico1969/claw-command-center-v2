"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Login failed");
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-50">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h1 className="text-xl font-semibold">OpenClaw Command Center</h1>
        <p className="mt-1 text-sm text-zinc-300">Enter password to continue.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            className="w-full rounded-md bg-zinc-950/60 border border-zinc-800 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />

          {error ? <div className="text-sm text-red-400">{error}</div> : null}

          <button
            className="w-full rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-3 py-2 font-medium"
            disabled={loading || password.length === 0}
            type="submit"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-xs text-zinc-400">
          Cookie auth (httpOnly). No client-side token storage.
        </div>
      </div>
    </div>
  );
}
