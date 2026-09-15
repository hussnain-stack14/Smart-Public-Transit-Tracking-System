"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BusFront, Clock3, MapPin, RefreshCw, Route as RouteIcon, Users, X } from "lucide-react";
import { Navbar } from "../navigation/Navbar";
import { Footer } from "../navigation/Footer";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { ErrorState } from "../common/ErrorState";
import { BusDetailsSkeleton } from "./BusDetailsSkeleton";
import { ClientTransitMap } from "../map/MapShell";
import { BusMarker } from "../map/BusMarker";
import { StopMarker } from "../map/StopMarker";
import { RoutePolyline } from "../map/RoutePolyline";
import { MapControls } from "../map/MapControls";
import { MapViewport } from "../map/MapViewport";
import { useLiveBuses } from "../../hooks/useLiveBuses";
import { useSocket } from "../../hooks/useSocket";
import { busService } from "../../services/busService";
import { routeService } from "../../services/routeService";
import { stopService } from "../../services/stopService";

function getPosition(bus) {
  if (bus.currentLocation?.latitude != null && bus.currentLocation?.longitude != null) return [bus.currentLocation.latitude, bus.currentLocation.longitude];
  if (bus.latitude != null && bus.longitude != null) return [bus.latitude, bus.longitude];
  return null;
}

function getEtaLabel(minutes) {
  if (minutes == null) return null;
  if (minutes <= 1) return "Arriving";
  return `${Math.round(minutes)} min`;
}

function getOccupancy(bus) {
  if (bus.occupancy) return bus.occupancy;
  return null;
}

function mergeUpdate(bus, update) {
  if (!update) return bus;
  const currentLocation = update.latitude != null ? { latitude: update.latitude, longitude: update.longitude } : bus.currentLocation;
  return {
    ...bus,
    ...update,
    busNumber: bus.busNumber,
    currentLocation,
    position: getPosition({ ...bus, ...update, currentLocation }),
    eta: update.etaMinutes != null ? getEtaLabel(update.etaMinutes) : bus.eta,
    nextStop: update.nextStop?.stopName || update.nextStop || bus.nextStop,
    distanceKm: update.distanceKm ?? bus.distanceKm,
    lastLocationUpdate: update.lastLocationUpdate || bus.lastLocationUpdate,
  };
}

export default function BusDetailsPage({ busId }) {
  const socket = useSocket();
  const liveUpdates = useLiveBuses([]);
  const [bus, setBus] = useState(null);
  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(() => socket.connected);

  const loadBus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const busData = await busService.get(busId);
      const routeId = busData.route?._id || busData.route;
      const [etaResult, routeResult, stopsResult] = await Promise.allSettled([
        busService.getEta(busId),
        routeId ? routeService.get(routeId) : Promise.resolve(null),
        routeId ? stopService.listByRoute(routeId) : Promise.resolve([]),
      ]);
      setBus({ ...busData, position: getPosition(busData), eta: etaResult.status === "fulfilled" ? getEtaLabel(etaResult.value.etaMinutes) : null, nextStop: etaResult.status === "fulfilled" ? etaResult.value.nextStop?.stopName : null, distanceKm: etaResult.status === "fulfilled" ? etaResult.value.distanceKm : null });
      setEta(etaResult.status === "fulfilled" ? etaResult.value : null);
      setRoute(routeResult.status === "fulfilled" ? routeResult.value : null);
      setStops(stopsResult.status === "fulfilled" && Array.isArray(stopsResult.value) ? stopsResult.value : []);
    } catch (requestError) {
      const isNotFound = requestError.response?.status === 404;
      if (!isNotFound) console.error("Unable to load bus details", requestError);
      setError(isNotFound ? "not-found" : "error");
    } finally {
      setLoading(false);
    }
  }, [busId]);

  useEffect(() => {
    Promise.resolve().then(() => loadBus());
  }, [loadBus]);

  useEffect(() => {
    if (busId) socket.emit("watchBus", busId);
  }, [busId, socket]);

  useEffect(() => {
    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket]);

  const liveBus = useMemo(() => {
    if (!bus) return null;
    const update = liveUpdates.find((item) => (item.id || item._id || item.busId)?.toString() === busId.toString());
    return mergeUpdate(bus, update);
  }, [bus, busId, liveUpdates]);

  const stopPositions = stops.filter((stop) => stop.latitude != null && stop.longitude != null).map((stop) => [stop.latitude, stop.longitude]);
  const busPosition = liveBus?.position;
  const mapPositions = busPosition ? [...stopPositions, busPosition] : stopPositions;
  const nextStopId = eta?.nextStop?._id?.toString();
  const routeId = liveBus?.route?._id || liveBus?.route || route?._id;
  const routeName = route?.routeName || liveBus?.route?.routeName || "Transit route";
  const routeLabel = route?.routeCode || route?.number || "Route";
  const occupancy = getOccupancy(liveBus || {});
  const lastUpdated = liveBus?.lastLocationUpdate ? new Date(liveBus.lastLocationUpdate).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : null;

  if (loading) return <div className="min-h-screen bg-[var(--background)]"><Navbar /><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><BusDetailsSkeleton /></main><Footer /></div>;
  if (error === "not-found") return <NotFoundState />;
  if (error || !liveBus) return <ErrorStatePage onRetry={loadBus} />;

  return <div className="min-h-screen overflow-x-hidden bg-[var(--background)]"><Navbar /><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><div className="flex items-center gap-2 text-sm text-[var(--muted)]"><Link href="/live-map" className="font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)]">Live Map</Link><span>/</span><span>{liveBus.busNumber}</span></div><header className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e3f3ec] text-[var(--primary)]"><BusFront size={20} /></span><Badge tone={liveBus.status === "active" ? "success" : "neutral"}>{liveBus.status || "Status unavailable"}</Badge></div><h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">{liveBus.busNumber}</h1><p className="mt-2 flex items-center gap-2 text-base text-[var(--muted)]"><span>{routeLabel}</span><span>·</span><span>{routeName}</span></p></div><Link href={routeId ? `/routes/${routeId}` : "/routes"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"><RouteIcon size={16} /> View full route</Link></header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatusCard label="Current status" value={liveBus.status || "Unavailable"} icon={BusFront} /><StatusCard label="ETA" value={liveBus.eta || "Unavailable"} icon={Clock3} /><StatusCard label="Next stop" value={liveBus.nextStop || "Unavailable"} icon={MapPin} /><StatusCard label="Seat availability" value={occupancy || "Unavailable"} icon={Users} /></section>

      <section className="relative mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[#eaf3ef] p-1 shadow-[0_14px_36px_rgba(23,51,45,0.08)]"><ClientTransitMap center={busPosition || stopPositions[0] || [31.4187, 73.0791]} zoom={14} className="h-[min(64vh,590px)] min-h-[420px] rounded-xl"><MapViewport positions={mapPositions.length ? mapPositions : [[31.4187, 73.0791]]} focusKey={`${busId}-${busPosition?.join("-") || "none"}`} /><RoutePolyline positions={stopPositions} color="#056044" />{stops.filter((stop) => stop.latitude != null && stop.longitude != null).map((stop) => <StopMarker key={stop._id} position={[stop.latitude, stop.longitude]} stop={stop} />)}{busPosition && <BusMarker position={busPosition} bus={liveBus} /> }<MapControls onShowAll={(map) => mapPositions.length && map.fitBounds(mapPositions, { padding: [32, 32], maxZoom: 15 })} /></ClientTransitMap><div className="pointer-events-none absolute bottom-5 left-5 z-[400] rounded-xl border border-white/70 bg-white/95 px-4 py-3 shadow-lg backdrop-blur"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${socketConnected ? "bg-[var(--success)]" : "bg-[var(--muted)]"}`} /><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">Live location</p></div><p className="mt-1 text-sm font-bold text-[var(--foreground)]">{socketConnected ? (lastUpdated ? `Updated ${lastUpdated}` : "Live") : "Last update unavailable"}</p></div></section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><div className="grid gap-6"><Card className="p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e4f5ed] text-[var(--primary)]"><MapPin size={18} /></span><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">Next stop</p><h2 className="mt-1 text-xl font-bold text-[var(--foreground)]">{liveBus.nextStop || "Not available"}</h2><div className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 text-sm sm:grid-cols-2"><div><p className="text-[var(--muted)]">ETA</p><p className="mt-1 font-semibold text-[var(--foreground)]">{liveBus.eta || "Unavailable"}</p></div>{liveBus.distanceKm != null && <div><p className="text-[var(--muted)]">Distance</p><p className="mt-1 font-semibold text-[var(--foreground)]">{liveBus.distanceKm} km</p></div>}</div></div></div></Card><UpcomingStops stops={stops} nextStopId={nextStopId} /></div><div className="grid gap-6"><Card className="p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">Service information</p><h2 className="mt-1 text-xl font-bold text-[var(--foreground)]">Current Route</h2></div><Badge tone="success">{routeLabel}</Badge></div><h3 className="mt-4 font-semibold text-[var(--foreground)]">{routeName}</h3><div className="mt-4 grid gap-2 text-sm text-[var(--muted)]"><span>{route?.startPoint || "Starting point unavailable"}</span><span className="ml-1 h-3 border-l border-dashed border-[var(--border)]" /><span>{route?.endPoint || "Destination unavailable"}</span></div>{routeId && <Link href={`/routes/${routeId}`} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)]">View full route <ArrowRight size={15} /></Link>}</Card><Card className="p-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">Bus details</p><h2 className="mt-1 text-xl font-bold text-[var(--foreground)]">{liveBus.busNumber}</h2><dl className="mt-5 grid gap-3 border-t border-[var(--border)] pt-4 text-sm"><DetailRow label="Route" value={routeLabel} />{liveBus.capacity != null && <DetailRow label="Capacity" value={`${liveBus.capacity} seats`} />}{liveBus.availableSeats != null && <DetailRow label="Seats available" value={liveBus.availableSeats} />}{liveBus.driver?.name && <DetailRow label="Driver" value={liveBus.driver.name} />}</dl></Card></div></div></main><Footer /></div>;
}

function StatusCard({ label, value, icon: Icon }) {
  return <Card className="p-4"><div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e4f5ed] text-[var(--primary)]"><Icon size={17} /></span><div className="min-w-0"><p className="text-xs text-[var(--muted)]">{label}</p><p className="mt-1 truncate font-bold text-[var(--foreground)]">{value}</p></div></div></Card>;
}

function DetailRow({ label, value }) {
  return <div className="flex items-center justify-between gap-4"><dt className="text-[var(--muted)]">{label}</dt><dd className="text-right font-semibold text-[var(--foreground)]">{value}</dd></div>;
}

function UpcomingStops({ stops, nextStopId }) {
  const nextIndex = stops.findIndex((stop) => stop._id?.toString() === nextStopId);
  if (nextIndex < 0) return null;
  const upcoming = stops.slice(nextIndex, nextIndex + 3);
  return <Card className="p-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">On the way</p><h2 className="mt-1 text-xl font-bold text-[var(--foreground)]">Upcoming Stops</h2><div className="mt-5 grid gap-3">{upcoming.map((stop, index) => <div key={stop._id} className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-[var(--primary)]" : "bg-[#b9d8cc]"}`} /><span className={index === 0 ? "font-semibold text-[var(--foreground)]" : "text-sm text-[var(--muted)]"}>{index === 0 ? "Next" : index === 1 ? "Then" : "Later"}: {stop.stopName}</span></div>)}</div></Card>;
}

function NotFoundState() {
  return <div className="min-h-screen bg-[var(--background)]"><Navbar /><main className="mx-auto grid min-h-[60vh] max-w-7xl place-items-center px-4 py-16 sm:px-6 lg:px-8"><Card className="max-w-lg p-8 text-center"><h1 className="text-2xl font-bold text-[var(--foreground)]">Bus not found</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">The bus you&apos;re looking for doesn&apos;t exist or is no longer available.</p><Link href="/live-map" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white"><ArrowLeft size={16} /> Back to live map</Link></Card></main><Footer /></div>;
}

function ErrorStatePage({ onRetry }) {
  return <div className="min-h-screen bg-[var(--background)]"><Navbar /><main className="mx-auto grid min-h-[60vh] max-w-7xl place-items-center px-4 py-16 sm:px-6 lg:px-8"><ErrorState title="Unable to load bus" description="We couldn&apos;t retrieve this bus right now." action={<Button type="button" variant="secondary" onClick={onRetry}><RefreshCw size={16} /> Try again</Button>} /></main><Footer /></div>;
}
