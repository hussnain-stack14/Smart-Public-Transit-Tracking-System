import Link from "next/link";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-[var(--background)] px-4 text-center"><div className="max-w-md"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--primary)]">404</p><h1 className="mt-2 text-3xl font-bold">Page not found</h1><p className="mt-3 text-sm text-[var(--muted)]">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/" className="rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white">Back home</Link><Link href="/live-map" className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold">Live map</Link></div></div></main>;
}