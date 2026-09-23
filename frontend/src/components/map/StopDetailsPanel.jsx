import Link from "next/link";
import { ArrowRight, BusFront, X } from "lucide-react";
import { Card } from "../common/Card";

export function StopDetailsPanel({ stop, onClose }) {
  if (!stop) return null;
  const routeName = stop.routeName || stop.route?.routeName;
  const routeId = stop.routeId || stop.route?._id || (typeof stop.route === "string" ? stop.route : null);
  return <Card className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">Transit stop</p><h2 className="mt-1 text-lg font-bold text-[var(--foreground)]">{stop.stopName || stop.name}</h2></div><button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[#eef7f3] hover:text-[var(--foreground)]" aria-label="Close stop details"><X size={17} /></button></div><div className="mt-4 flex items-center gap-3 border-t border-[var(--border)] pt-4 text-sm"><BusFront size={16} className="shrink-0 text-[var(--primary)]" /><div><p className="text-xs text-[var(--muted)]">Route</p><p className="mt-0.5 font-semibold text-[var(--foreground)]">{routeName || "Route information is not available"}</p></div></div><Link href={routeId ? `/routes/${routeId}` : "/routes"} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)]">View route <ArrowRight size={15} /></Link></Card>;
}
