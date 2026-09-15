"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, BusFront, CheckCircle2, Clock3, LogOut, MapPin, Navigation, RefreshCw, Route as RouteIcon, Users } from "lucide-react";
import { Navbar } from "../navigation/Navbar";
import { Footer } from "../navigation/Footer";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { EmptyState } from "../common/EmptyState";
import { ErrorState } from "../common/ErrorState";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { StatCard } from "../common/StatCard";
import { ClientTransitMap } from "../map/MapShell";
import { BusMarker } from "../map/BusMarker";
import { StopMarker } from "../map/StopMarker";
import { RoutePolyline } from "../map/RoutePolyline";
import { MapControls } from "../map/MapControls";
import { MapViewport } from "../map/MapViewport";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { useLiveBuses } from "../../hooks/useLiveBuses";
import { getProfile } from "../../services/authService";
import { busService } from "../../services/busService";
import { routeService } from "../../services/routeService";
import { stopService } from "../../services/stopService";
import { alertService } from "../../services/alertService";
import { clearAccessToken } from "../../lib/auth/token";

function positionFromBus(bus) {
  if (bus?.currentLocation?.latitude != null && bus.currentLocation?.longitude != null) return [bus.currentLocation.latitude, bus.currentLocation.longitude];
  return null;
}

function etaLabel(eta) {
  if (!eta || eta.etaMinutes == null) return "Unavailable";
  return eta.etaMinutes <= 1 ? "Arriving" : `${Math.round(eta.etaMinutes)} min`;
}

export default function DriverDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const socket = useSocket();
  const liveUpdates = useLiveBuses([]);
  const watchId = useRef(null);
  const [profile, setProfile] = useState(null);
  const [bus, setBus] = useState(null);
  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState("connecting");
  const [tracking, setTracking] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [actionError, setActionError] = useState("");
  const [updatingSeats, setUpdatingSeats] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError("");
    try {
      const driver = await getProfile();
      if (driver.role !== "driver") {
        setError("unauthorized");
        return;
      }
      setProfile(driver);
      if (!driver.assignedBus) {
        setBus(null);
        setRoute(null);
        setStops([]);
        return;
      }
      const busId = driver.assignedBus._id || driver.assignedBus;
      const busData = await busService.get(busId);
      const routeId = busData.route?._id || busData.route;
      const [routeResult, stopsResult, etaResult, alertResult] = await Promise.allSettled([
        routeId ? routeService.get(routeId) : Promise.resolve(null),
        routeId ? stopService.listByRoute(routeId) : Promise.resolve([]),
        busService.getEta(busId),
        routeId ? alertService.listByRoute(routeId) : Promise.resolve([]),
      ]);
      setBus(busData);
      setRoute(routeResult.status === "fulfilled" ? routeResult.value : null);
      setStops(stopsResult.status === "fulfilled" && Array.isArray(stopsResult.value) ? stopsResult.value : []);
      setEta(etaResult.status === "fulfilled" ? etaResult.value : null);
      setAlerts(alertResult.status === "fulfilled" && Array.isArray(alertResult.value) ? alertResult.value : []);
    } catch (requestError) {
      if ([401, 403].includes(requestError.response?.status)) setError(requestError.response.status === 403 ? "unauthorized" : "auth");
      else {
        console.error("Unable to load driver dashboard", requestError);
        setError("load");
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    Promise.resolve().then(() => loadDashboard());
  }, [loadDashboard]);

  useEffect(() => {
    const connected = () => setConnection("live");
    const disconnected = () => setConnection("offline");
    setConnection(socket.connected ? "live" : "connecting");
    socket.on("connect", connected);
    socket.on("disconnect", disconnected);
    return () => {
      socket.off("connect", connected);
      socket.off("disconnect", disconnected);
    };
  }, [socket]);

  const liveBus = useMemo(() => {
    if (!bus) return null;
    const update = liveUpdates.find((item) => (item.id || item._id || item.busId)?.toString() === bus._id?.toString());
    if (!update) return bus;
    return { ...bus, ...update, currentLocation: update.latitude != null ? { latitude: update.latitude, longitude: update.longitude } : bus.currentLocation, lastLocationUpdate: update.lastLocationUpdate || bus.lastLocationUpdate };
  }, [bus, liveUpdates]);

  useEffect(() => {
    if (bus?._id) socket.emit("watchBus", bus._id);
  }, [bus?._id, socket]);

  function stopTracking() {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setTracking(false);
  }

  function startTracking() {
    setLocationError("");
    setActionError("");
    if (!bus?._id || !navigator.geolocation) {
      setLocationError("Location tracking is not supported by this browser.");
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(async ({ coords }) => {
      try {
        const updatedBus = await busService.updateLocation(bus._id, { latitude: coords.latitude, longitude: coords.longitude, speed: coords.speed == null ? undefined : coords.speed * 3.6 });
        setBus(updatedBus);
        setEta({ etaMinutes: updatedBus.etaMinutes, nextStop: updatedBus.nextStop, distanceKm: updatedBus.distanceKm });
      } catch (requestError) {
        console.error("Unable to update driver location", requestError);
        setLocationError("Unable to update live location. Please try again.");
      }
    }, () => setLocationError("Location permission is required to start live tracking."), { enableHighAccuracy: true, maximumAge: 10000 });
    setTracking(true);
  }

  async function updateSeats(event) {
    const availableSeats = Number(event.target.value);
    if (!Number.isInteger(availableSeats) || availableSeats < 0 || availableSeats > bus.capacity) return;
    setUpdatingSeats(true);
    setActionError("");
    try {
      setBus(await busService.updateSeats(bus._id, availableSeats));
    } catch (requestError) {
      console.error("Unable to update seat availability", requestError);
      setActionError("Unable to update seat availability.");
    } finally {
      setUpdatingSeats(false);
    }
  }

  function logout() {
    stopTracking();
    clearAccessToken();
    router.replace("/login?redirect=/driver/dashboard");
  }

  if (authLoading || loading) return <PageShell><div className="grid min-h-96 place-items-center"><LoadingSpinner label="Loading driver dashboard..." /></div></PageShell>;
  if (!isAuthenticated || error === "auth") return <PageShell><StateCard title="Sign in required" description="Sign in with a driver account to access this dashboard." actionHref="/login?redirect=/driver/dashboard" actionLabel="Sign in" /></PageShell>;
  if (error === "unauthorized") return <PageShell><StateCard title="Driver access required" description="This account does not have permission to open the driver dashboard." actionHref="/live-map" actionLabel="Back to live map" /></PageShell>;
  if (error === "load") return <PageShell><ErrorState title="Unable to load dashboard" description="We couldn't retrieve your driver information right now." action={<Button type="button" variant="secondary" onClick={loadDashboard}><RefreshCw size={16} /> Try again</Button>} /></PageShell>;

  const routePositions = stops.filter((stop) => stop.latitude != null && stop.longitude != null).map((stop) => [stop.latitude, stop.longitude]);
  const busPosition = positionFromBus(liveBus);
  const mapPositions = busPosition ? [...routePositions, busPosition] : routePositions;
  const nextStop = eta?.nextStop?.stopName || "Unavailable";

  return <PageShell><header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">Operations</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">Driver Dashboard</h1><p className="mt-2 text-sm text-[var(--muted)]">Welcome{profile?.name ? `, ${profile.name}` : ""}. Manage your assigned bus and live location.</p></div><div className="flex items-center gap-3"><Badge tone={connection === "live" ? "success" : connection === "offline" ? "danger" : "warning"}>{connection === "live" ? "Live" : connection === "offline" ? "Offline" : "Connecting"}</Badge><Button type="button" variant="secondary" className="gap-2" onClick={logout}><LogOut size={15} /> Log out</Button></div></header><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Assigned bus" value={liveBus?.busNumber || "None"} icon={BusFront} /><StatCard label="Route" value={route?.routeName || "None"} icon={RouteIcon} /><StatCard label="Next stop" value={nextStop} icon={MapPin} /><StatCard label="Bus status" value={liveBus?.status || "Unavailable"} icon={CheckCircle2} /></div>{!bus ? <div className="mt-6"><EmptyState title="No bus assigned" description="There is no bus assigned to this driver account yet." /></div> : <><div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"><section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[#eaf3ef] p-1 shadow-[0_14px_36px_rgba(23,51,45,0.08)]"><ClientTransitMap center={busPosition || routePositions[0] || [31.4187, 73.0791]} zoom={14} className="h-[min(62vh,560px)] min-h-[420px] rounded-xl"><MapViewport positions={mapPositions.length ? mapPositions : [[31.4187, 73.0791]]} focusKey={`${bus._id}-${busPosition?.join("-") || "none"}`} /><RoutePolyline positions={routePositions} color="#056044" />{stops.filter((stop) => stop.latitude != null && stop.longitude != null).map((stop) => <StopMarker key={stop._id} position={[stop.latitude, stop.longitude]} stop={stop} />)}{busPosition && <BusMarker position={busPosition} bus={liveBus} />}<MapControls onShowAll={(map) => mapPositions.length && map.fitBounds(mapPositions, { padding: [32, 32], maxZoom: 15 })} /></ClientTransitMap><div className="pointer-events-none absolute bottom-5 left-5 z-[400] rounded-xl border border-white/70 bg-white/95 px-4 py-3 shadow-lg"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">Current location</p><p className="mt-1 text-sm font-bold text-[var(--foreground)]">{busPosition ? "GPS location available" : "Location unavailable"}</p></div></section><Card className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">Assigned Bus</p><h2 className="mt-1 text-xl font-bold text-[var(--foreground)]">{liveBus.busNumber}</h2></div><Badge tone={liveBus.status === "active" ? "success" : "neutral"}>{liveBus.status}</Badge></div><dl className="mt-5 grid gap-4 border-t border-[var(--border)] pt-4 text-sm"><Detail label="Route" value={route?.routeName || liveBus.route?.routeName || "Unavailable"} /><Detail label="Next stop" value={nextStop} /><Detail label="ETA" value={etaLabel(eta)} /><Detail label="Available seats" value={liveBus.availableSeats == null ? "Unavailable" : `${liveBus.availableSeats} / ${liveBus.capacity}`} /></dl><div className="mt-5 border-t border-[var(--border)] pt-4"><p className="text-sm font-semibold text-[var(--foreground)]">Live location</p><div className="mt-3 flex gap-2"><Button type="button" className="flex-1" onClick={tracking ? stopTracking : startTracking}>{tracking ? "Stop tracking" : "Start live tracking"}</Button></div>{locationError && <p className="mt-3 text-sm text-[var(--danger)]">{locationError}</p>}</div><div className="mt-5 border-t border-[var(--border)] pt-4"><label className="grid gap-2 text-sm font-semibold text-[var(--foreground)]" htmlFor="available-seats">Update available seats<input id="available-seats" type="number" min="0" max={liveBus.capacity} defaultValue={liveBus.availableSeats} onBlur={updateSeats} disabled={updatingSeats} className="field-input" /></label><p className="mt-2 text-xs text-[var(--muted)]">The backend accepts the available seat count for this assigned bus.</p></div>{actionError && <p className="mt-4 text-sm text-[var(--danger)]">{actionError}</p>}</Card></div><div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"><Card className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">Assigned Route</p><h2 className="mt-1 text-xl font-bold text-[var(--foreground)]">{route?.routeName || "Route unavailable"}</h2></div>{route?._id && <Link href={`/routes/${route._id}`} className="text-sm font-semibold text-[var(--primary)]">View route</Link>}</div><div className="mt-5 grid gap-3 text-sm text-[var(--muted)]"><p>{route?.startPoint || "Starting point unavailable"}</p><span className="ml-1 h-4 border-l border-dashed border-[var(--border)]" /><p>{route?.endPoint || "Destination unavailable"}</p></div></Card><section><div className="flex items-center gap-2"><AlertTriangle size={17} className="text-[var(--primary)]" /><h2 className="text-xl font-bold text-[var(--foreground)]">Route Alerts</h2></div><div className="mt-4 grid gap-3">{alerts.length ? alerts.map((alert) => <Card key={alert._id} className="border-[#f0d7aa] bg-[#fff9ed] p-4 text-sm text-[#6f531d]">{alert.message}</Card>) : <p className="text-sm text-[var(--muted)]">No active alerts for this route.</p>}</div></section></div></>}</PageShell>;
}

function PageShell({ children }) {
  return <div className="min-h-screen overflow-x-hidden bg-[var(--background)]"><Navbar /><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">{children}</main><Footer /></div>;
}

function Detail({ label, value }) {
  return <div><dt className="text-[var(--muted)]">{label}</dt><dd className="mt-1 font-semibold text-[var(--foreground)]">{value}</dd></div>;
}

function etaLabel(eta) {
  if (!eta || eta.etaMinutes == null) return "Unavailable";
  return eta.etaMinutes <= 1 ? "Arriving" : `${Math.round(eta.etaMinutes)} min`;
}

function StateCard({ title, description, actionHref, actionLabel }) {
  return <Card className="mx-auto max-w-lg p-8 text-center"><h1 className="text-2xl font-bold text-[var(--foreground)]">{title}</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p><Link href={actionHref} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white">{actionLabel}</Link></Card>;
}
