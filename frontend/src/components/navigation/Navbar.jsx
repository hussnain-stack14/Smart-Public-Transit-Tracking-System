"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, BusFront, ArrowRight } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils/cn";

const links = [
  { label: "Home", href: "/" },
  { label: "Live Map", href: "/live-map" },
  { label: "Routes", href: "/routes" },
  { label: "My Trips", href: "/my-trips" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[#f5f8f7]/95 backdrop-blur">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <Link href="/" className="flex items-center gap-2.5" onClick={() => setIsOpen(false)}>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--primary)] text-white"><BusFront size={19} /></span>
        <span className="leading-none"><span className="block text-sm font-bold text-[var(--foreground)]">Smart Transit</span><span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Faisalabad</span></span>
      </Link>
      <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
        {links.map((link) => <Link key={link.href} href={link.href} className={cn("rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white hover:text-[var(--primary)]", pathname === link.href ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--muted)]")}>{link.label}</Link>)}
      </nav>
      <Link href="/login" className="hidden items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)] md:inline-flex">Driver / Admin Login <ArrowRight size={15} /></Link>
      <button type="button" className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border)] bg-white text-[var(--foreground)] md:hidden" aria-label={isOpen ? "Close menu" : "Open menu"} aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}>{isOpen ? <X size={19} /> : <Menu size={19} />}</button>
    </div>
    <div className={cn("border-t border-[var(--border)] bg-white px-4 py-3 md:hidden", !isOpen && "hidden")}>
      <nav className="grid gap-1" aria-label="Mobile navigation">{links.map((link) => <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)} className={cn("rounded-xl px-3 py-3 text-sm font-semibold hover:bg-[#eef7f3]", pathname === link.href ? "bg-[#eef7f3] text-[var(--primary)]" : "text-[var(--foreground)]")}>{link.label}</Link>)}<Link href="/login" onClick={() => setIsOpen(false)} className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white">Driver / Admin Login <ArrowRight size={15} /></Link></nav>
    </div>
  </header>;
}
