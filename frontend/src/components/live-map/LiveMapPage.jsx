"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LocateFixed, MapPinned, RefreshCw, Search, Wifi, WifiOff, X } from "lucide-react";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { EmptyState } from "../common/EmptyState";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { BusCard } from "../bus/BusCard";
import { Navbar } from "../navigation/Navbar";
import { Footer } from "../navigation/Footer";
import { ClientTransitMap } from "../map/MapShell";
import { BusMarker } from "../map/BusMarker";
import { StopMarker } from "../map/StopMarker";
import { RoutePolyline } from "../map/RoutePolyline";
import { MapControls } from "../map/MapControls";
import { MapViewport } from "../map/MapViewport";
import { LiveMapLegend } from "../map/LiveMapLegend";
import { StopDetailsPanel } from "../map/StopDetailsPanel";
import { BusDetailsPanel } from "../map/BusDetailsPanel";
import { useLiveBuses } from "../../hooks/useLiveBuses";
import { useSocket } from "../../hooks/useSocket";
import { busService } from "../../services/busService";
import { routeService } from "../../services/routeService";
import { stopService } from "../../services/stopService";
import { getRouteId, normalizeBus, getBusPosition } from "../../lib/transit/format";

const statusOptions = ["All", "active", "idle", "maintenance"];

export default function LiveMapPage() {
  const socket = useSocket();
  const liveUpdates = useLiveBuses([]);
  const [apiBuses, setApiBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [routeStops, setRouteStops] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("All routes");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const [connection, setConnection] = useState("connecting");
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      try {
        const [routeData, busData] = await Promise.all([routeService.list(), busService.list()]);
        const routeList = Array.isArray(routeData) ? routeData : routeData.routes || [];
        const routeMap = Object.fromEntries(routeList.map((route) => [getRouteId(route), route]));
        const etaResults = await Promise.all(busData.map(async (bus) => {
          try {
            return await busService.getEta(bus._id);
          } catch {
            return null;
          }
        }));
        const geometry = await Promise.all(routeList.map(async (route) => ({
          route,
          stops: await stopService.listByRoute(getRouteId(route)).catch(() => []),
        })));
        if (!cancelled) {
          setRoutes(routeList);
          setApiBuses(busData.map((bus, index) => normalizeBus(bus, etaResults[index], routeMap)));
          setRouteStops(geometry);
        }
      } catch (error) {
        console.error("Unable to load live transit data", error);
        }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const markLive = () => setConnection("live");
    const markOffline = () => setConnection("offline");
    const markConnecting = () => setConnection("connecting");
    socket.on("connect", markLive);
    socket.on("disconnect", markOffline);
    socket.on("connect_error", markOffline);
    socket.io.on("reconnect_attempt", markConnecting);
    if (socket.connected) markLive();
    return () => {
      socket.off("connect", markLive);
      socket.off("disconnect", markOffline);
      socket.off("connect_error", markOffline);
      socket.io.off("reconnect_attempt", markConnecting);
    };
  }, [socket]);

  const buses = useMemo(() => apiBuses.map((bus) => {
    const update = liveUpdates.find((item) => (item.id || item._id || item.busId)?.toString() === bus.id?.toString());
    if (!update) return bus;
    const direction = update.direction === "return" ? "return" : bus.direction;
    const origin = direction === "return" ? bus.routeEnd : bus.routeStart;
    const destination = direction === "return" ? bus.routeStart : bus.routeEnd;
    return { ...bus, ...update, direction, directionLabel: origin && destination ? `${origin} → ${destination}` : bus.directionLabel, nextStop: update.nextStop?.stopName || update.nextStop || bus.nextStop, nextStopId: update.nextStop?._id || bus.nextStopId, eta: update.etaMinutes != null ? (update.etaMinutes <= 1 ? "Arriving" : `${Math.round(update.etaMinutes)} min`) : bus.eta, position: getBusPosition(update) || bus.position };
  }), [apiBuses, liveUpdates]);

  const filteredBuses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return buses.filter((bus) => {
      const matchesTerm = !term || `${bus.number} ${bus.route} ${bus.routeName} ${bus.nextStop || ""}`.toLowerCase().includes(term);
      const matchesRoute = selectedRoute === "All routes" || bus.routeId === selectedRoute;
      const matchesStatus = selectedStatus === "All" || bus.status === selectedStatus;
      return matchesTerm && matchesRoute && matchesStatus;
    });
  }, [buses, searchTerm, selectedRoute, selectedStatus]);

  const selectedGeometry = routeStops.find(({ route }) => getRouteId(route) === selectedRoute);
  const selectedRouteLine = (selectedGeometry?.stops || routeStops[0]?.stops || []).filter((stop) => stop.latitude != null && stop.longitude != null).map((stop) => [stop.latitude, stop.longitude]);
  const operatingBuses = buses.filter((bus) => bus.status === "active");
  const mapPositions = operatingBuses.map((bus) => bus.position).filter(Boolean);
  const routeOptions = routes.map((route) => ({ id: getRouteId(route), label: route.routeName || route.routeCode || "Route" }));
  const visibleStops = (selectedGeometry ? selectedGeometry.stops.map((stop) => ({ stop, route: selectedGeometry.route })) : routeStops.flatMap((item) => item.stops.map((stop) => ({ stop, route: item.route })))).filter(({ stop }) => stop.latitude != null && stop.longitude != null).map(({ stop, route }) => ({ ...stop, id: stop._id, name: stop.stopName, routeId: getRouteId(route), routeName: route.routeName, position: [stop.latitude, stop.longitude] }));
  const routeCards = routes.slice(0, 2).map((route) => ({ ...route, id: getRouteId(route), number: route.routeCode || route.number || "Route", name: route.routeName, start: route.startPoint, end: route.endPoint, stops: routeStops.find((item) => getRouteId(item.route) === getRouteId(route))?.stops.length || 0, buses: `${apiBuses.filter((bus) => bus.routeId === getRouteId(route) && bus.status === "active").length} active` }));
  const routeLine = selectedRouteLine;
  const stops = visibleStops;
  const popularRoutes = routeCards;

  function locateUser(map) {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      map.setView([coords.latitude, coords.longitude], 15);
    });
  }

  function showAllBuses(map) {
    const positions = buses.filter((bus) => bus.status === "active").map((bus) => bus.position).filter(Boolean);
    if (positions.length) map.fitBounds(positions, { padding: [32, 32], maxZoom: 14 });
    setSelectedBus(null);
    setSelectedStop(null);
  }

  function selectBus(bus) {
    setSelectedBus(bus);
    setSelectedStop(null);
  }

  return <div className="min-h-screen overflow-x-hidden bg-[var(--background)]"><Navbar /><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">Live transit</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">Track buses in real time.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">See active buses, routes, stops and estimated arrival times across Faisalabad.</p></div><Badge tone={connection === "live" ? "success" : connection === "offline" ? "danger" : "warning"}><span className="mr-1.5">{connection === "live" ? "●" : connection === "offline" ? "×" : "○"}</span>{connection === "live" ? "Live network" : connection === "offline" ? "Offline" : "Connecting"}</Badge></header>

      {connection === "offline" && <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-[#f0d7aa] bg-[#fff9ed] px-4 py-3 text-sm text-[#8a611a]"><span>Live updates unavailable. Showing the latest available transit information.</span><WifiOff size={17} className="shrink-0" /></div>}
      {connection === "connecting" && <div className="mt-6 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--muted)]"><RefreshCw size={16} className="animate-spin text-[var(--primary)]" /> Connecting to live transit updates...</div>}

      <Card className="mobile-map-filters mt-6 p-3 sm:p-4"><div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]"><label className="flex min-h-11 items-center gap-3 rounded-xl border border-[var(--border)] bg-[#fbfdfc] px-3.5"><Search size={18} className="shrink-0 text-[var(--primary)]" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]" placeholder="Search bus, route or stop..." aria-label="Search bus, route or stop" />{searchTerm && <button type="button" onClick={() => setSearchTerm("")} className="text-[var(--muted)]" aria-label="Clear search"><X size={16} /></button>}</label><label className="grid gap-1 text-xs font-semibold text-[var(--muted)]"><span className="sr-only">Route filter</span><select value={selectedRoute} onChange={(event) => setSelectedRoute(event.target.value)} className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-medium text-[var(--foreground)] outline-none focus:border-[var(--primary)]"><option>All routes</option>{routeOptions.map((route) => <option key={route.id} value={route.id}>{route.label}</option>)}</select></label><label className="grid gap-1 text-xs font-semibold text-[var(--muted)]"><span className="sr-only">Bus status filter</span><select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-medium text-[var(--foreground)] outline-none focus:border-[var(--primary)]">{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label><Button type="button" variant="secondary" className="min-h-11 gap-2" onClick={() => setSearchTerm("")}><LocateFixed size={16} /> Reset</Button></div></Card>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start"><div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[#eaf3ef] p-1 shadow-[0_14px_36px_rgba(23,51,45,0.08)]"><div className="relative"><ClientTransitMap center={[31.416, 73.078]} zoom={13} className="h-[min(66vh,600px)] min-h-[420px] rounded-xl" onLoad={() => setMapReady(true)}><MapViewport positions={mapPositions.length ? mapPositions : [routeLine[0], routeLine[routeLine.length - 1]]} focusKey={`${selectedRoute}-${filteredBuses.length}`} /><RoutePolyline positions={selectedRouteLine} color={selectedRoute === "All routes" ? "#087f5b" : "#056044"} />{operatingBuses.map((bus) => bus.position && <BusMarker key={bus.id} position={bus.position} bus={bus} onSelect={selectBus} />)}{stops.map((stop) => <StopMarker key={stop.id} position={stop.position} stop={stop} onSelect={(nextStop) => { setSelectedStop(nextStop); setSelectedBus(null); }} />)}<MapControls onLocate={locateUser} onShowAll={showAllBuses} /></ClientTransitMap><LiveMapLegend />{!mapReady && <div className="pointer-events-none absolute inset-0 z-[450] grid place-items-center rounded-xl bg-[#eaf3ef]/70"><LoadingSpinner label="Loading live transit data..." /></div>}</div>{selectedBus && <div className="absolute bottom-4 left-4 right-4 z-[500] sm:max-w-sm"><BusDetailsPanel bus={selectedBus} onClose={() => setSelectedBus(null)} /></div>}{selectedStop && <div className="absolute bottom-4 left-4 right-4 z-[500] sm:max-w-sm"><StopDetailsPanel stop={selectedStop} onClose={() => setSelectedStop(null)} /></div>}</div>

        <aside className="grid gap-4"><Card className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">Network now</p><h2 className="mt-1 text-xl font-bold text-[var(--foreground)]">Fleet</h2></div><span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--success)]"><Wifi size={14} /> Updates on</span></div><p className="mt-2 text-sm text-[var(--muted)]">{filteredBuses.length} of {buses.length} buses shown</p></Card>{filteredBuses.length ? filteredBuses.map((bus) => <div key={bus.id} className="cursor-pointer" onClick={() => selectBus(bus)}><BusCard bus={bus} /></div>) : <EmptyState title="No active buses" description="There are currently no buses matching your filters." action={<Button type="button" variant="secondary" onClick={() => { setSearchTerm(""); setSelectedRoute("All routes"); setSelectedStatus("All"); }}>Clear filters</Button>} />}</aside></section>

      <section className="mt-6 grid gap-4 md:grid-cols-3"><Card className="p-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e4f5ed] text-[var(--primary)]"><MapPinned size={17} /></span><div><p className="text-sm font-bold text-[var(--foreground)]">{stops.length} stops visible</p><p className="text-xs text-[var(--muted)]">Tap a stop for route information.</p></div></div></Card>{popularRoutes.slice(0, 2).map((route) => <Card key={route.id} className="p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">{route.number}</p><p className="mt-1 text-sm font-bold text-[var(--foreground)]">{route.name}</p></div><Link href={`/routes/${route.id}`} className="text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)]">View route</Link></div><p className="mt-2 text-xs text-[var(--muted)]">{route.stops} stops · {route.buses}</p></Card>)}</section></main><Footer /></div>;
}
