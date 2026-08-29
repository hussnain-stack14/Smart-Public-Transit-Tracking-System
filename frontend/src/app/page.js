'use client';

// src/app/page.js
// Homepage — shows a personalised welcome if logged in, otherwise a hero CTA.
// Reads the ?error=unauthorized query param from ProtectedRoute redirects.

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();
  const searchParams      = useSearchParams();
  const accessDenied      = searchParams.get("error") === "unauthorized";

  // While the session check is in flight, show a minimal loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-navy">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy px-4 font-body">

      {/* Unauthorised access banner */}
      {accessDenied && (
        <div className="mb-6 max-w-md w-full rounded-lg border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral text-center">
          ⚠ You don't have access to that page.
        </div>
      )}

      {user ? (
        /* ── Authenticated hero ── */
        <div className="text-center">
          <h1 className="font-display text-6xl font-black tracking-wider text-amber uppercase">
            Sawari
          </h1>
          <p className="mt-2 font-mono text-sm tracking-widest text-teal-soft uppercase">
            Real-Time Transit · Faisalabad
          </p>

          <p className="mt-10 text-2xl font-semibold text-cream">
            Welcome back,{" "}
            <span className="text-amber">{user.name.split(" ")[0]}</span> 👋
          </p>
          <p className="mt-2 text-sm text-teal-soft capitalize">
            Signed in as {user.role}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/profile"
              className="rounded-lg bg-amber px-6 py-2.5 font-semibold text-navy-deep hover:bg-amber-hover transition"
            >
              View Profile
            </Link>
          </div>
        </div>
      ) : (
        /* ── Guest hero ── */
        <div className="w-full max-w-lg text-center">
          <h1 className="font-display text-7xl font-black tracking-wider text-amber uppercase">
            Sawari
          </h1>
          <p className="mt-2 font-mono text-sm tracking-widest text-teal-soft uppercase">
            Real-Time Transit · Faisalabad
          </p>

          <p className="mt-8 text-lg text-cream leading-relaxed">
            Know where your bus is before you leave the house.
            <br />
            <span className="text-teal-soft text-sm">
              Live bus tracking for public transit across Faisalabad.
            </span>
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="rounded-lg bg-amber px-8 py-3 font-semibold text-navy-deep hover:bg-amber-hover transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-teal/40 px-8 py-3 font-semibold text-cream hover:border-amber hover:text-amber transition"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
