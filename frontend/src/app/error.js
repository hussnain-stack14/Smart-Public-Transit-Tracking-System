"use client";
import Link from "next/link";
import { useEffect } from "react";
export default function ErrorPage({ error, reset }) {
  useEffect(() => { console.error("Application error", error); }, [error]);
  return <main className="grid min-h-screen place-items-center bg-[var(--background)] px-4 text-center"><div><h1 className="text-3xl font-bold">Something went wrong</h1><p className="mt-3 text-sm text-[var(--muted)]">We couldn&apos;t complete that request. Please try again.</p><div className="mt-7 flex justify-center gap-3"><button type="button" onClick={reset} className="rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-contrast)]">Try again</button><Link href="/" className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold">Back home</Link></div></div></main>;
}