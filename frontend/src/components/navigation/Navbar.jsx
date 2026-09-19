"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "../../lib/utils/cn";
import { BrandMark } from "../common/BrandMark";
import { useAuth } from "../../hooks/useAuth";
import { clearAccessToken } from "../../lib/auth/token";
import { getProfile } from "../../services/authService";

const publicLinks = [{ label: "Home", href: "/" }, { label: "Live Map", href: "/live-map" }, { label: "Routes", href: "/routes" }];
const commuterLinks = [{ label: "Booking", href: "/booking" }, { label: "My Trips", href: "/my-trips" }, { label: "Safety", href: "/safety" }, { label: "Profile", href: "/profile" }];
const driverLinks = [{ label: "Driver Dashboard", href: "/driver/dashboard" }, { label: "Profile", href: "/profile" }];
const adminLinks = [{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Buses", href: "/admin/buses" }, { label: "Drivers", href: "/admin/users" }, { label: "Routes", href: "/admin/routes" }, { label: "Stops", href: "/admin/stops" }, { label: "Alerts", href: "/admin/alerts" }, { label: "Reports", href: "/admin/reports" }, { label: "Profile", href: "/profile" }];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) { queueMicrotask(() => setRole("")); return; }
    let active = true;
    getProfile().then((user) => { if (active) setRole(user.role || ""); }).catch(() => { if (active) setRole(""); });
    return () => { active = false; };
  }, [isAuthenticated, token]);

  const links = [...publicLinks, ...(role === "admin" ? adminLinks : role === "driver" ? driverLinks : role === "commuter" ? commuterLinks : [])];
  function handleLogout() { clearAccessToken(); setRole(""); setIsOpen(false); router.replace("/"); }
  const navLinks = (mobile = false) => links.map((link) => <Link key={link.href} href={link.href} onClick={() => mobile && setIsOpen(false)} className={cn(mobile ? "rounded-xl px-3 py-3 text-sm font-semibold hover:bg-[#eef7f3]" : "rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white hover:text-[var(--primary)]", pathname === link.href ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--muted)]")}>{link.label}</Link>);
  const desktop = role === "admin" ? "xl" : "md";
  return <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[#f5f8f7]/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><Link href="/" className="flex items-center gap-2.5" onClick={() => setIsOpen(false)}><BrandMark size={36} priority /><span className="leading-none"><span className="block text-sm font-bold text-[var(--foreground)]">Smart Transit</span><span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Faisalabad</span></span></Link><nav className={cn("hidden items-center gap-1", desktop === "xl" ? "xl:flex" : "md:flex")} aria-label="Primary navigation">{navLinks()}</nav>{isAuthenticated ? <button type="button" onClick={handleLogout} className={cn("hidden rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white", desktop === "xl" ? "xl:inline-flex" : "md:inline-flex")}>Log out</button> : <div className="hidden items-center gap-2 md:flex"><Link href="/register" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--primary)]">Create account</Link><Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white">Sign In <ArrowRight size={15} /></Link></div>}<button type="button" className={cn("grid h-11 w-11 place-items-center rounded-xl border border-[var(--border)] bg-white", desktop === "xl" ? "xl:hidden" : "md:hidden")} aria-label={isOpen ? "Close menu" : "Open menu"} aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}>{isOpen ? <X size={19} /> : <Menu size={19} />}</button></div><div className={cn("max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-[var(--border)] bg-white px-4 py-3", desktop === "xl" ? "xl:hidden" : "md:hidden", !isOpen && "hidden")}><nav className="grid gap-1" aria-label="Mobile navigation">{navLinks(true)}{isAuthenticated ? <button type="button" onClick={handleLogout} className="mt-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white">Log out</button> : <Link href="/login" onClick={() => setIsOpen(false)} className="mt-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-center text-sm font-semibold text-white">Sign In</Link>}</nav></div></header>;
}