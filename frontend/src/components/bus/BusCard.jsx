import Link from "next/link";
import { Clock3, MapPin, Users } from "lucide-react";
import { Badge } from "../common/Badge";
import { Card } from "../common/Card";

const occupancyTone = { Available: "success", Limited: "warning", Full: "danger" };

export function BusCard({ bus }) {
  const operating = bus.status === "active" || bus.status === "Active" || ["On Time", "Delayed", "Arriving"].includes(bus.status);
  return (
    <Link href={`/buses/${bus.id}`} className="block">
      <Card className="overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.1)]">
        {/* Bus photo strip */}
        <div className="relative h-28 overflow-hidden bg-[var(--surface-subtle)]">
          <img
            src="/transit-bus.jpg"
            alt={`${bus.number || bus.busNumber} transit bus`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between gap-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-white/90 drop-shadow">
              {bus.routeName || bus.route || "Transit route"}
            </p>
            <Badge tone={operating ? "success" : "neutral"}>{operating ? "Live" : "Off"}</Badge>
          </div>
        </div>

        {/* Card body */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-[var(--foreground)]">{bus.number || bus.busNumber}</h3>
          {bus.directionLabel && (
            <p className="mt-1 truncate text-sm font-semibold text-[var(--foreground)]">{bus.directionLabel}</p>
          )}
          {operating ? (
            <div className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 text-sm">
              <Info icon={Clock3} label="ETA" value={bus.eta} />
              <Info icon={MapPin} label="Next stop" value={bus.nextStop} />
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-[var(--muted)]"><Users size={15} /> Seats</span>
                <Badge tone={occupancyTone[bus.occupancy] || "neutral"}>
                  {bus.occupancy || (bus.availableSeats != null ? `${bus.availableSeats} available` : "Unavailable")}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="mt-4 border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)]">
              Live trip details are available when this bus is operating.
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 text-[var(--muted)]"><Icon size={15} /> {label}</span>
      <strong key={String(value)} className="live-transit-value max-w-[55%] truncate text-right text-[var(--foreground)]">
        {value || "Unavailable"}
      </strong>
    </div>
  );
}
