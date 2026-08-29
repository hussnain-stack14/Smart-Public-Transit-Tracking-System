'use client';

// src/app/login/page.js
// Login page — dark navy transit aesthetic, amber CTA, cream text.
// Calls useAuth().login() which handles token storage internally.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

export default function LoginPage() {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const router    = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic client-side validation
    if (!email || !password) {
      setError("Please fill in both fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setSubmitting(true);
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4 font-body">
      <div className="w-full max-w-md">

        {/* Brand header */}
        <div className="mb-10 text-center">
          <h1 className="font-display text-5xl font-black tracking-wider text-amber uppercase">
            Sawari
          </h1>
          <p className="mt-1 text-sm font-mono text-teal-soft tracking-widest uppercase">
            Real-Time Transit · Faisalabad
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-navy-deep border border-teal/20 p-8 shadow-2xl">
          <h2 className="mb-6 text-xl font-semibold text-cream">Sign in to your account</h2>

          {/* Error banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-cream">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-teal/30 bg-navy px-4 py-2.5 text-cream placeholder-teal-soft/40 transition focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-cream">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-teal/30 bg-navy px-4 py-2.5 text-cream placeholder-teal-soft/40 transition focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center rounded-lg bg-amber px-4 py-3 font-semibold text-navy-deep transition hover:bg-amber-hover focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2 focus:ring-offset-navy-deep disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-navy-deep border-t-transparent" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-teal-soft">
            No account?{" "}
            <Link href="/register" className="font-medium text-amber hover:text-amber-hover transition">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
