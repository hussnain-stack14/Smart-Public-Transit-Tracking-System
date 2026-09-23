"use client";
import Link from "next/link";
import { ArrowRight, Bell, BusFront, MapPinned, Route as RouteIcon, Users } from "lucide-react";
import { Card } from "../common/Card";

const links = [
  { label: "Drivers", description: "Manage driver accounts", href: "/admin/users", icon: Users },
  { label: "Buses", description: "Manage the fleet", href: "/admin/buses", icon: BusFront },
  { label: "Routes", description: "Manage routes and stops", href: "/admin/routes", icon: RouteIcon },
  { label: "Stops", description: "Manage transit stops", href: "/admin/stops", icon: MapPinned },
  { label: "Route alerts", description: "Publish passenger updates", href: "/admin/alerts", icon: Bell },
];

export function QuickActions() {
  return <Card className="p-5"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--primary)]">Shortcuts</p><h2 className="mt-1 text-lg font-bold">Quick actions</h2><p className="mt-1 text-xs text-[var(--muted)]">Open the tools used most often.</p></div><div className="mt-5 grid grid-cols-2 gap-3">{links.map(({ label, description, href, icon: Icon }) => <Link key={href} href={href} className="group flex min-h-28 min-w-0 flex-col justify-between rounded-2xl border border-[var(--border)] bg-[#f8fbfa] p-4 transition hover:border-[var(--primary)] hover:bg-[#eef8f3]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e1f2eb] text-[var(--primary)]"><Icon size={19} /></span><span className="mt-4 flex items-end justify-between gap-2"><span className="min-w-0"><strong className="block text-sm">{label}</strong><small className="mt-1 block text-[11px] leading-4 text-[var(--muted)]">{description}</small></span><ArrowRight size={15} className="shrink-0 text-[var(--primary)]" /></span></Link>)}</div></Card>;
}
