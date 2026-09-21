"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { BrandMark } from "../common/BrandMark";
import { useAuth } from "../../hooks/useAuth";

const links = [
  { href: "/", label: "Home" },
  { href: "/live-map", label: "Live Buses" },
  { href: "/routes", label: "Routes" },
];
export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return null;
  return <header className="legacy-navbar sticky top-0 z-50 border-b border-[var(--border)] bg-[#f5f8f7]/95 backdrop-blur">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}><BrandMark size={36} priority /><span className="leading-none"><strong className="block text-sm">Smart Safar</strong><small className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Faisalabad</small></span></Link>
      <nav className="hidden items-center gap-1 md:flex" aria-label="Public navigation">{links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-white hover:text-[var(--primary)]">{link.label}</Link>)}</nav>
      <div className="hidden items-center gap-2 md:flex"><Link href="/register" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--primary)]">Create account</Link><Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white">Sign In <ArrowRight size={15} /></Link></div>
      <button type="button" className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--border)] bg-white md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? <X size={19} /> : <Menu size={19} />}</button>
    </div>
    {open && <nav className="grid gap-1 border-t border-[var(--border)] bg-white px-4 py-3 md:hidden" aria-label="Mobile public navigation">{links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold">{link.label}</Link>)}<Link href="/login" onClick={() => setOpen(false)} className="mt-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-center text-sm font-semibold text-white">Sign In</Link><Link href="/register" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-[var(--primary)]">Create account</Link></nav>}
  </header>;
}
