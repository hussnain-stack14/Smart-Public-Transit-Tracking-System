import { Clock3, MapPin, Users } from "lucide-react";
import { Badge } from "../common/Badge";
import { Card } from "../common/Card";

const statusTone = { "On Time": "success", Delayed: "warning", Arriving: "neutral" };
const occupancyTone = { Available: "success", Limited: "warning", Full: "danger" };

export function BusCard({ bus }) {
  return <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(23,51,45,0.1)]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">{bus.route}</p><h3 className="mt-1 text-lg font-bold text-[var(--foreground)]">{bus.number}</h3></div><Badge tone={statusTone[bus.status] || "neutral"}>{bus.status || "Status unavailable"}</Badge></div><p className="mt-3 truncate text-sm text-[var(--muted)]">{bus.routeName}</p><div className="mt-5 grid gap-3 border-t border-[var(--border)] pt-4 text-sm"><div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-[var(--muted)]"><Clock3 size={15} /> ETA</span><strong className="text-[var(--foreground)]">{bus.eta || "Unavailable"}</strong></div><div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-[var(--muted)]"><MapPin size={15} /> Next stop</span><strong className="max-w-[55%] truncate text-right text-[var(--foreground)]">{bus.nextStop || "Unavailable"}</strong></div><div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-[var(--muted)]"><Users size={15} /> Seats</span><Badge tone={occupancyTone[bus.occupancy] || "neutral"}>{bus.occupancy || "Unavailable"}</Badge></div></div></Card>;
}
