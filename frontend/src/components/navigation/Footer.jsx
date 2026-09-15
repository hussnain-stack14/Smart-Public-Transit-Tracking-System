import Link from "next/link";
import { BusFront, Mail, MapPin } from "lucide-react";

const links = [
  { label: "Live Map", href: "/live-map" },
  { label: "Routes", href: "/routes" },
  { label: "Booking", href: "/booking" },
  { label: "Safety", href: "/safety" },
];

export function Footer() {
  return <footer className="border-t border-[var(--border)] bg-white"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8"><div><Link href="/" className="inline-flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--primary)] text-white"><BusFront size={19} /></span><span className="font-bold text-[var(--foreground)]">Smart Transit</span></Link><p className="mt-4 max-w-xs text-sm leading-6 text-[var(--muted)]">Better information for everyday journeys across Faisalabad.</p></div><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Explore</p><div className="mt-4 grid gap-3">{links.map((link) => <Link key={link.href} href={link.href} className="text-sm text-[var(--foreground)] hover:text-[var(--primary)]">{link.label}</Link>)}</div></div><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Access</p><div className="mt-4 grid gap-3"><Link href="/driver/login" className="text-sm text-[var(--foreground)] hover:text-[var(--primary)]">Driver Login</Link><Link href="/admin/login" className="text-sm text-[var(--foreground)] hover:text-[var(--primary)]">Admin Login</Link><span className="inline-flex items-center gap-2 text-sm text-[var(--muted)]"><MapPin size={15} /> Faisalabad, Pakistan</span><a href="mailto:help@smarttransit.pk" className="inline-flex items-center gap-2 text-sm text-[var(--muted)]"><Mail size={15} /> Transit support</a></div></div></div><div className="border-t border-[var(--border)] px-4 py-4 sm:px-6 lg:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-xs text-[var(--muted)]"><span>© 2026 Smart Transit Faisalabad</span><span>Public transit, made clearer.</span></div></div></footer>;
}
