"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, BusFront, House, Route, Search } from "lucide-react";
import { BrandMark } from "../common/BrandMark";
import { useAuth } from "../../hooks/useAuth";

const links = [
  { href: "/", label: "Home" },
  { href: "/live-map", label: "Live Buses" },
  { href: "/routes", label: "Routes" },
];

const mobileLinks = [
  { href: "/", label: "Home", icon: House },
  { href: "/live-map", label: "Live Buses", icon: BusFront },
  { href: "/routes", label: "Routes", icon: Route },
  { href: "/#transit-search", label: "Search", icon: Search },
];

export function Navbar() {
  const pathname = usePathname();
  const [activeHash, setActiveHash] = useState("");
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const updateHash = () => setActiveHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [pathname]);

  if (isAuthenticated) return null;

  return <>
    <header className="legacy-navbar public-header sticky top-0 z-[800] border-b border-[var(--border)] bg-[#f5f8f7]/95 backdrop-blur">
      <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <BrandMark size={34} priority />
          <span className="min-w-0 leading-none"><strong className="block truncate text-sm">Smart Safar</strong><small className="mt-1 block truncate text-[10px] font-semibold tracking-[0.04em] text-[var(--muted)] sm:uppercase sm:tracking-[0.16em] sm:text-[var(--primary)]">Faisalabad transit</small></span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Public navigation">{links.map((link) => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-white hover:text-[var(--primary)]">{link.label}</Link>)}</nav>
        <div className="hidden items-center gap-2 md:flex"><Link href="/register" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--primary)]">Create account</Link><Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white">Sign In <ArrowRight size={15} /></Link></div>
        <Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white md:hidden">Sign In</Link>
      </div>
    </header>
    <nav className="public-bottom-nav md:hidden" aria-label="Public mobile navigation">{mobileLinks.map(({ href, label, icon: Icon }) => {
      const searchItem = href.includes("#transit-search");
      const targetPath = href.split("#")[0] || "/";
      const active = searchItem ? pathname === "/" && activeHash === "#transit-search" : pathname === targetPath && !(targetPath === "/" && activeHash === "#transit-search");
      return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={active ? "is-active" : undefined}><Icon size={20} /><span>{label}</span></Link>;
    })}</nav>
  </>;
}
