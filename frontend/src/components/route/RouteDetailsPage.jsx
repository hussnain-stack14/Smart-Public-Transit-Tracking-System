"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, BusFront, Clock3, MapPin, RefreshCw, Route as RouteIcon, Ticket, X } from "lucide-react";
import { Navbar } from "../navigation/Navbar";
import { Footer } from "../navigation/Footer";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { EmptyState } from "../common/EmptyState";
import { ErrorState } from "../common/ErrorState";
import { BusCard } from "../bus/BusCard";
import { RouteStopTimeline } from "./RouteStopTimeline";
import { RouteDetailsSkeleton } from "./RouteDetailsSkeleton";
import { ClientTransitMap } from "../map/MapShell";
import { BusMarker } from "../map/BusMarker";
import { StopMarker } from "../map/StopMarker";
import { RoutePolyline } from "../map/RoutePolyline";
import { MapControls } from "../map/MapControls";
import { MapViewport } from "../map/MapViewport";
import { useLiveBuses } from "../../hooks/useLiveBuses";
import { routeService } from "../../services/routeService";
import { stopService } from "../../services/stopService";
import { busService } from "../../services/busService";
import { alertService } from "../../services/alertService";

function getId(item) {
  return item?._id || item?.id || item?.busId;
}

function getPosition(bus) {
  if (Array.isArray(bus.position)) return bus.position;
  if (bus.currentLocation?.latitude != null && bus.currentLocation?.longitude != null) return [bus.currentLocation.latitude, bus.currentLocation.longitude];
  if (bus.latitude != null && bus.longitude != null) return [bus.latitude, bus.longitude];
  return null;
}

function getEtaLabel(eta) {
  if (!eta || eta.etaMinutes == null) return null;
  if (eta.etaMinutes <= 1) return "Arriving";
  return `${Math.round(eta.etaMinutes)} min`;
}

function normalizeBus(bus, eta, route) {
  const nextStop = eta?.nextStop?.stopName || bus.nextStop?.stopName || bus.nextStop || null;
  return {
    ...bus,
    id: getId(bus),
    number: bus.busNumber || bus.number || "Transit bus",
    route: route.routeCode || route.number || "Route",
    routeName: route.routeName,
    status: bus.status === "active" ? "Active" : bus.status || "Status unavailable",
    eta: getEtaLabel(eta) || bus.eta || null,
    nextStop,
    position: getPosition(bus),
  };
}

function mergeLiveUpdate(bus, update) {
  if (!update) return bus;
  const position = update.latitude != null && update.longitude != null ? [update.latitude, update.longitude] : getPosition(update) || bus.position;
  const merged = normalizeBus({ ...bus, ...update, currentLocation: update.latitude != null ? { latitude: update.latitude, longitude: update.longitude } : bus.currentLocation }, { etaMinutes: update.etaMinutes, nextStop: update.nextStop }, { routeCode: bus.route, routeName: bus.routeName });
  return { ...merged, position };
}

export default function RouteDetailsPage({ routeId }) {
  const liveUpdates = useLiveBuses([]);
  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [buses, setBuses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertError, setAlertError] = useState(false);
  const [selectedStop, setSelectedStop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRoute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const routeData = await routeService.get(routeId);
      const [stopResult, busResult, alertResult] = await Promise.allSettled([
        stopService.listByRoute(routeId),
        busService.list({ route: routeId }),
        alertService.listByRoute(routeId),
      ]);
      const routeStops = stopResult.status === "fulfilled" && Array.isArray(stopResult.value) ? stopResult.value : [];
      const routeBuses = busResult.status === "fulfilled" && Array.isArray(busResult.value) ? busResult.value : [];
      const routeAlerts = alertResult.status === "fulfilled" && Array.isArray(alertResult.value) ? alertResult.value : [];
      const etaResults = await Promise.all(routeBuses.map(async (bus) => {
        try {
          return await busService.getEta(getId(bus));
        } catch (etaError) {
          console.error("Unable to load bus ETA", etaError);
          return null;
        }
      }));
      setRoute(routeData);
      setStops(routeStops);
      setBuses(routeBuses.map((bus, index) => normalizeBus(bus, etaResults[index], routeData)));
      setAlerts(routeAlerts);
      setAlertError(alertResult.status === "rejected");
    } catch (requestError) {
      const isNotFound = requestError.response?.status === 404;
      if (!isNotFound) console.error("Unable to load route details", requestError);
      setError(isNotFound ? "not-found" : "error");
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    Promise.resolve().then(() => loadRoute());
  }, [loadRoute]);

  const displayedBuses = useMemo(() => {
    const updatesById = new Map(liveUpdates.map((update) => [getId(update), update]));
    return buses.map((bus) => mergeLiveUpdate(bus, updatesById.get(bus.id))).filter((bus) => bus.status === "Active");
  }, [buses, liveUpdates]);

  const positions = stops.filter((stop) => stop.latitude != null && stop.longitude != null).map((stop) => [stop.latitude, stop.longitude]);
  const busPositions = displayedBuses.map((bus) => bus.position).filter(Boolean);
  const mapPositions = [...positions, ...busPositions];
  const routeLabel = route?.routeCode || route?.number || "Route";

  if (loading) return <div className="min-h-screen bg-[var(--background)]"><Navbar /><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><RouteDetailsSkeleton /></main><Footer /></div>;
  if (error === "not-found") return <NotFoundState />;
  if (error || !route) return <RouteErrorState onRetry={loadRoute} />;

  return <div className="min-h-screen overflow-x-hidden bg-[var(--background)]"><Navbar /><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><div><Link href="/routes" aria-label="Back to routes" className="inline-grid h-11 w-11 place-items-center rounded-xl border border-[var(--border)] bg-white text-[var(--primary)] hover:border-[var(--primary)]"><ArrowLeft size={19} /></Link></div><header className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><div className="flex items-center gap-3"><span className="grid min-h-11 min-w-11 place-items-center rounded-xl bg-[#e3f3ec] px-2 text-sm font-bold text-[var(--primary)]">{routeLabel}</span><Badge tone={route.isActive ? "success" : "danger"}>{route.isActive ? "Active" : "Not operating"}</Badge></div><h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">{route.routeName}</h1><p className="mt-2 flex items-center gap-2 text-base text-[var(--muted)]"><MapPin size={17} className="text-[var(--primary)]" /> {route.startPoint} <ArrowRight size={15} /> {route.endPoint}</p></div><div className="flex flex-col gap-3 sm:flex-row"><Link href={`/booking?route=${encodeURIComponent(route._id || routeId)}`} className="commuter-only-action inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)]"><Ticket size={16} /> Book Ticket</Link><Link href={`/live-map?route=${routeId}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)]"><BusFront size={16} /> View live buses</Link><Link href={`/live-map?route=${routeId}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"><RouteIcon size={16} /> Track route</Link></div></header>

      {alertError && <Card className="mt-6 border-[#efcaca] bg-[#fff5f5] p-4 text-sm text-[var(--danger)]">Route alerts could not be loaded. Please try again.</Card>}
      {alerts.length > 0 && <section className="mt-6 grid gap-3">{alerts.map((alert) => <Card key={alert._id || alert.id} className="border-[#f0d7aa] bg-[#fff9ed] p-4"><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#ffedc5] text-[#9b6a19]"><AlertTriangle size={17} /></span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9b6a19]">Current route alert</p><p className="mt-1 text-sm leading-6 text-[#6f531d]">{alert.message}</p></div></div></Card>)}</section>}

      <section className="relative mt-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[#eaf3ef] p-1 shadow-[0_14px_36px_rgba(23,51,45,0.08)]"><ClientTransitMap center={positions[0] || [31.4187, 73.0791]} zoom={13} className="h-[min(62vh,560px)] min-h-[380px] rounded-xl"><MapViewport positions={mapPositions.length ? mapPositions : [[31.4187, 73.0791]]} focusKey={`${routeId}-${stops.length}-${displayedBuses.length}`} /><RoutePolyline positions={positions} color="#056044" />{stops.filter((stop) => stop.latitude != null && stop.longitude != null).map((stop) => <StopMarker key={stop._id} position={[stop.latitude, stop.longitude]} stop={stop} onSelect={setSelectedStop} />)}{displayedBuses.map((bus) => bus.position && <BusMarker key={bus.id} position={bus.position} bus={bus} />)}<MapControls onShowAll={(map) => mapPositions.length && map.fitBounds(mapPositions, { padding: [32, 32], maxZoom: 14 })} /></ClientTransitMap><div className="pointer-events-none absolute bottom-5 left-5 z-[400] rounded-xl border border-white/70 bg-white/95 px-4 py-3 shadow-lg backdrop-blur"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">{routeLabel}</p><p className="mt-1 text-sm font-bold text-[var(--foreground)]">{route.routeName}</p><p className="mt-1 text-xs text-[var(--muted)]">{stops.length} stops · {displayedBuses.length} active buses</p></div></section>

      {selectedStop && <Card className="mt-4 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">Selected stop</p><h2 className="mt-1 text-lg font-bold text-[var(--foreground)]">{selectedStop.stopName}</h2><p className="mt-2 text-sm text-[var(--muted)]">Stop {selectedStop.stopOrder ?? ""} on this route. Arrival information is shown when provided by the backend.</p></div><button type="button" onClick={() => setSelectedStop(null)} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[#eef7f3]" aria-label="Close stop information"><X size={17} /></button></div></Card>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><RouteStopTimeline stops={stops} selectedStop={selectedStop} onSelect={setSelectedStop} /><section><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">On this route</p><h2 className="mt-1 text-xl font-bold text-[var(--foreground)]">Buses on this route</h2></div><span className="text-sm text-[var(--muted)]">{displayedBuses.length} active</span></div><div className="mt-4 grid gap-4">{displayedBuses.length ? displayedBuses.map((bus) => <Link key={bus.id} href={`/buses/${bus.id}`} className="block"><BusCard bus={bus} /></Link>) : <EmptyState title="No active buses" description="There are currently no buses broadcasting live locations on this route." />}</div></section></div>

      {route.description && <Card className="mt-6 p-5"><div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e4f5ed] text-[var(--primary)]"><Clock3 size={17} /></span><div><h2 className="font-bold text-[var(--foreground)]">About this route</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{route.description}</p></div></div></Card>}
    </main><Footer /></div>;
}

function NotFoundState() {
  return <div className="min-h-screen bg-[var(--background)]"><Navbar /><main className="mx-auto grid min-h-[60vh] max-w-7xl place-items-center px-4 py-16 sm:px-6 lg:px-8"><Card className="max-w-lg p-8 text-center"><h1 className="text-2xl font-bold text-[var(--foreground)]">Route not found</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">The route you&apos;re looking for doesn&apos;t exist or is no longer available.</p><Link href="/routes" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white"><ArrowLeft size={16} /> Back to routes</Link></Card></main><Footer /></div>;
}

function RouteErrorState({ onRetry }) {
  return <div className="min-h-screen bg-[var(--background)]"><Navbar /><main className="mx-auto grid min-h-[60vh] max-w-7xl place-items-center px-4 py-16 sm:px-6 lg:px-8"><ErrorState title="Unable to load route" description="We couldn&apos;t retrieve this route right now." action={<Button type="button" variant="secondary" onClick={onRetry}><RefreshCw size={16} /> Try again</Button>} /></main><Footer /></div>;
}
