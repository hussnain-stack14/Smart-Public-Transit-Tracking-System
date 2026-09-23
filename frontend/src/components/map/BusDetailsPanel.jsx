import Link from "next/link";
import { ArrowRight, Clock3, MapPin, Users, X } from "lucide-react";
import { Badge } from "../common/Badge";
import { Card } from "../common/Card";

export function BusDetailsPanel({ bus, onClose }) {
  if (!bus) return null;
  const operating = bus.status === "active" || bus.status === "Active" || ["On Time", "Delayed", "Arriving"].includes(bus.status);
  return <Card className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">{bus.routeName || bus.route || "Transit route"}</p><h2 className="mt-1 text-lg font-bold text-[var(--foreground)]">{bus.number || bus.busNumber || "Bus details"}</h2>{bus.directionLabel && <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{bus.directionLabel}</p>}</div><button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[#eef7f3]" onClick={onClose} aria-label="Close bus details"><X size={17} /></button></div><div className="mt-4"><Badge tone={operating ? "success" : "neutral"}>{operating ? "Currently operating" : "Not operating"}</Badge></div>{operating ? <div className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 text-sm"><Row icon={Clock3} label="ETA" value={bus.eta} /><Row icon={MapPin} label="Next stop" value={bus.nextStop} /><Row icon={Users} label="Seats" value={bus.occupancy || (bus.availableSeats != null ? `${bus.availableSeats} available` : null)} /></div> : <p className="mt-4 border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)]">This bus is not currently running a live trip.</p>}<Link href={`/buses/${bus.id || bus.busId || bus._id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)]">View bus details <ArrowRight size={15} /></Link></Card>;
}
function Row({ icon: Icon, label, value }) { return <div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-[var(--muted)]"><Icon size={15} /> {label}</span><strong className="max-w-[58%] truncate text-right">{value || "Unavailable"}</strong></div>; }
