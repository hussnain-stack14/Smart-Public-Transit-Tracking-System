import { Clock3, MapPin, Users } from "lucide-react";
import { Badge } from "../common/Badge";
import { Card } from "../common/Card";

const occupancyTone = { Available: "success", Limited: "warning", Full: "danger" };

export function BusCard({ bus }) {
  const operating = bus.status === "active" || bus.status === "Active" || ["On Time", "Delayed", "Arriving"].includes(bus.status);
  return <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(23,51,45,0.1)]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">{bus.routeName || bus.route || "Transit route"}</p><h3 className="mt-1 text-lg font-bold text-[var(--foreground)]">{bus.number || bus.busNumber}</h3></div><Badge tone={operating ? "success" : "neutral"}>{operating ? "Currently operating" : "Not operating"}</Badge></div>{bus.directionLabel && <p className="mt-3 truncate text-sm font-semibold text-[var(--foreground)]">{bus.directionLabel}</p>}{operating ? <div className="mt-5 grid gap-3 border-t border-[var(--border)] pt-4 text-sm"><Info icon={Clock3} label="ETA" value={bus.eta} /><Info icon={MapPin} label="Next stop" value={bus.nextStop} /><div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-[var(--muted)]"><Users size={15} /> Seats</span><Badge tone={occupancyTone[bus.occupancy] || "neutral"}>{bus.occupancy || (bus.availableSeats != null ? `${bus.availableSeats} available` : "Unavailable")}</Badge></div></div> : <p className="mt-4 border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)]">Live trip details are available when this bus is operating.</p>}</Card>;
}
function Info({ icon: Icon, label, value }) { return <div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-[var(--muted)]"><Icon size={15} /> {label}</span><strong className="max-w-[55%] truncate text-right text-[var(--foreground)]">{value || "Unavailable"}</strong></div>; }
