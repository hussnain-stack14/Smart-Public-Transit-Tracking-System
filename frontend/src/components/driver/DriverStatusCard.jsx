import { BusFront, Clock3, Flag, LocateFixed, MapPin, Navigation, Route, Square, Play } from "lucide-react";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { getEtaLabel } from "../../lib/transit/format";

export function DriverStatusCard({ bus, route, eta, errors, direction, directionLabel, shiftActive, shiftCompleted, shiftBusy, shiftError, hasRouteAssignment, gpsStatus, onShift, returnBusy, returnError, onReturn, children }) {
  const gpsLabel = !shiftActive ? "Off" : gpsStatus.state === "sharing" ? "Live" : gpsStatus.state === "permission-denied" ? "Permission required" : gpsStatus.state === "error" ? "Location error" : "Starting";
  return (
    <Card id="driver-shift" aria-label="Driver assignment and shift" className="driver-status-card mt-4 scroll-mt-20 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e7f5ed] text-[var(--primary)]"><BusFront size={23} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[var(--muted)]">Assigned bus</p>
          <h2 className="break-words text-xl font-bold">{bus.busNumber}</h2>
          <p className="mt-2 flex items-start gap-2 text-sm"><Route size={16} className="mt-0.5 shrink-0 text-[var(--primary)]" aria-hidden="true" /><span className="min-w-0 break-words">{errors.route ? "Unable to load route" : route?.routeName || bus.route?.routeName || (hasRouteAssignment ? "Route unavailable" : "No route assigned")}</span></p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={shiftActive ? "success" : shiftCompleted ? "neutral" : "warning"} className="gap-1.5"><Clock3 size={14} aria-hidden="true" />Shift: {shiftActive ? "Active" : shiftCompleted ? "Completed" : "Not started"}</Badge>
        <Badge tone={shiftActive && gpsStatus.state === "sharing" ? "success" : shiftActive ? "warning" : "neutral"} className="gap-1.5"><LocateFixed size={14} aria-hidden="true" />GPS: {gpsLabel}</Badge>
      </div>
      <dl className="driver-live-grid mt-4 grid gap-2 sm:grid-cols-2">
        <StatusDetail icon={MapPin} label="Current stop" value={eta?.currentStop?.stopName || "Not reported"} />
        <StatusDetail icon={Flag} label="Next stop" value={errors.eta ? "Unable to load" : eta?.nextStop?.stopName || "Unavailable"} />
        <StatusDetail icon={Clock3} label="ETA to next stop" value={errors.eta ? "Unable to load" : getEtaLabel(eta) || "Unavailable"} />
        <StatusDetail icon={Navigation} label="Direction" value={direction === "return" ? "Return" : "Outbound"} description={route ? directionLabel : null} />
      </dl>
      {!hasRouteAssignment && <p className="mt-3 text-sm text-[var(--muted)]">Your assigned bus does not currently have a route.</p>}
      <Button type="button" variant={shiftActive ? "danger" : "primary"} disabled={Boolean(shiftBusy) || !hasRouteAssignment} onClick={onShift} aria-busy={Boolean(shiftBusy)} className="mt-4 min-h-12 w-full gap-2">
        {shiftActive ? <Square size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        {shiftBusy === "starting" ? "Starting Shift…" : shiftBusy === "ending" ? "Ending Shift…" : shiftActive ? "End Shift" : "Start Shift"}
      </Button>
      {shiftError && <p role="alert" className="mt-3 text-sm text-[var(--danger)]">{shiftError}</p>}
      {shiftActive && direction === "outbound" && eta?.terminalReached && <div className="mt-3 rounded-xl bg-[#eef7f3] p-3"><p className="text-sm font-semibold text-[var(--success)]">Terminal reached{eta.currentStop?.stopName ? ` · ${eta.currentStop.stopName}` : ""}</p><Button type="button" className="mt-2 min-h-12 w-full" onClick={onReturn} disabled={returnBusy}>{returnBusy ? "Starting return…" : "Start Return Trip"}</Button></div>}
      {returnError && <p role="alert" className="mt-3 text-sm text-[var(--danger)]">{returnError}</p>}
      {children}
    </Card>
  );
}

function StatusDetail({ icon: Icon, label, value, description }) {
  return <div className="flex min-w-0 items-start gap-2.5 rounded-xl bg-[var(--background)] p-3"><Icon size={17} className="mt-0.5 shrink-0 text-[var(--primary)]" aria-hidden="true" /><div className="flex min-w-0 flex-1 items-start justify-between gap-3"><dt className="shrink-0 pt-0.5 text-xs text-[var(--muted)]">{label}</dt><dd className="min-w-0 break-words text-right text-sm font-semibold">{value}{description && <span className="mt-1 block text-xs font-normal text-[var(--muted)]">{description}</span>}</dd></div></div>;
}
