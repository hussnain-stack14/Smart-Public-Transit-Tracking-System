'use client';

// src/app/register/page.js
// Public registration page. Exposes Commuter / Driver roles only — never "admin".
// Uses useAuth().register() which follows the exact same pattern as login().

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

export default function RegisterPage() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone]     = useState("");
  const [role, setRole]       = useState("commuter"); // default
  const [error, setError]     = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const router       = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!name.trim() || !email || !password) {
      setError("Name, email, and password are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setSubmitting(true);
      await register(name.trim(), email, password, phone || undefined, role);
      router.push("/");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4 py-10 font-body">
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
          <h2 className="mb-6 text-xl font-semibold text-cream">Create your account</h2>

          {/* Error banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full name */}
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-cream">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ali Hassan"
                className="w-full rounded-lg border border-teal/30 bg-navy px-4 py-2.5 text-cream placeholder-teal-soft/40 transition focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
              />
            </div>

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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full rounded-lg border border-teal/30 bg-navy px-4 py-2.5 text-cream placeholder-teal-soft/40 transition focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
              />
            </div>

            {/* Phone (optional) */}
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-cream">
                Phone number{" "}
                <span className="font-normal text-teal-soft">(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 0000000"
                className="w-full rounded-lg border border-teal/30 bg-navy px-4 py-2.5 text-cream placeholder-teal-soft/40 transition focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
              />
            </div>

            {/* Role toggle — Commuter / Driver only; admin is never exposed publicly */}
            <div>
              <label className="mb-2 block text-sm font-medium text-cream">
                I am a…
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["commuter", "driver"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`rounded-lg border py-2.5 text-sm font-semibold capitalize transition
                      ${role === r
                        ? "border-amber bg-amber/10 text-amber"
                        : "border-teal/30 text-teal-soft hover:border-amber/50 hover:text-cream"
                      }`}
                  >
                    {r === "commuter" ? "🚌 Commuter" : "🚍 Driver"}
                  </button>
                ))}
              </div>
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
                "Create Account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-teal-soft">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-amber hover:text-amber-hover transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
