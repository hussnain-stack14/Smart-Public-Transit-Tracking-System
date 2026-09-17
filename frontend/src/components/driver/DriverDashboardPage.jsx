"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Navbar } from "../navigation/Navbar";
import { Footer } from "../navigation/Footer";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { EmptyState } from "../common/EmptyState";
import { ErrorState } from "../common/ErrorState";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ProtectedPage } from "../common/ProtectedPage";
import { DriverMap } from "./DriverMap";
import { DriverRouteCard } from "./DriverRouteCard";
import { DriverLocationControl } from "./DriverLocationControl";
import { DriverSeatControl } from "./DriverSeatControl";
import { useSocket } from "../../hooks/useSocket";
import { busService } from "../../services/busService";
import { routeService } from "../../services/routeService";
import { stopService } from "../../services/stopService";
import { alertService } from "../../services/alertService";
import { getProfile } from "../../services/authService";
import { getEtaLabel } from "../../lib/transit/format";
import { hasRole, ROLES } from "../../lib/auth/permissions";

export default function DriverDashboardPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-[var(--primary)]">
        <ProtectedPage driverOnly>{(user) => <DriverOperations key={user._id} user={user} />}</ProtectedPage>
      </main>
      <Footer />
    </div>
  );
}

function DriverOperations({ user }) {
  const socket = useSocket();
  const requestId = useRef(0);
  const [data, setData] = useState({ profile: user, bus: null, route: null, stops: [], eta: null, alerts: [], errors: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState(socket.connected ? "Connected" : "Connecting");

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const profile = await getProfile();
      if (!hasRole(profile, ROLES.DRIVER)) {
        if (id === requestId.current) setError("Your account no longer has driver access. Sign out and sign in again.");
        return;
      }
      const busId = profile.assignedBus?._id || profile.assignedBus;
      if (!busId) {
        if (id === requestId.current) setData({ profile, bus: null, route: null, stops: [], eta: null, alerts: [], errors: {} });
        return;
      }
      const bus = await busService.get(busId);
      const routeId = bus.route?._id || bus.route;
      const keys = ["route", "stops", "eta", "alerts"];
      const results = await Promise.allSettled([
        routeId ? routeService.get(routeId) : Promise.resolve(null),
        routeId ? stopService.listByRoute(routeId) : Promise.resolve([]),
        busService.getEta(busId),
        routeId ? alertService.listByRoute(routeId) : Promise.resolve([]),
      ]);
      if (id !== requestId.current) return;
      const next = { profile, bus, errors: {} };
      results.forEach((result, index) => {
        const key = keys[index];
        next[key] = result.status === "fulfilled" ? result.value : ["stops", "alerts"].includes(key) ? [] : null;
        if (result.status === "rejected") next.errors[key] = true;
      });
      setData(next);
    } catch (requestError) {
      if (id === requestId.current) setError(requestError.response?.status === 404 ? "Your assigned bus is no longer available. Contact the transit team or try refreshing." : "Unable to load your assigned bus. Check your connection and try again.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) load(); });
    return () => { active = false; requestId.current += 1; };
  }, [load]);

  const busId = data.bus?._id;
  useEffect(() => {
    const watch = () => {
      if (busId) socket.emit("watchBus", busId);
    };
    const connected = () => { setConnection("Connected"); watch(); };
    const disconnected = () => setConnection("Disconnected");
    const failed = () => setConnection("Reconnecting");
    const update = (location) => {
      if (location.busId !== busId) return;
      setData((current) => {
        if (current.bus?._id !== location.busId) return current;
        return {
          ...current,
          bus: { ...current.bus, currentLocation: { latitude: location.latitude, longitude: location.longitude }, lastLocationUpdate: location.lastLocationUpdate, status: location.status },
          eta: { nextStop: location.nextStop, etaMinutes: location.etaMinutes, distanceKm: location.distanceKm },
          errors: { ...current.errors, eta: false },
        };
      });
    };
    socket.on("connect", connected);
    socket.on("disconnect", disconnected);
    socket.on("connect_error", failed);
    socket.on("locationUpdate", update);
    if (socket.connected) watch();
    return () => {
      socket.off("connect", connected);
      socket.off("disconnect", disconnected);
      socket.off("connect_error", failed);
      socket.off("locationUpdate", update);
    };
  }, [socket, busId]);

  const locationUpdated = useCallback((updated) => {
    setData((current) => {
      if (current.bus?._id !== updated._id) return current;
      return {
        ...current,
        bus: { ...current.bus, ...updated },
        eta: { nextStop: updated.nextStop, etaMinutes: updated.etaMinutes, distanceKm: updated.distanceKm },
        errors: { ...current.errors, eta: false },
      };
    });
  }, []);
  const seatsUpdated = useCallback((updated) => {
    setData((current) => {
      if (current.bus?._id !== updated._id) return current;
      return { ...current, bus: { ...current.bus, availableSeats: updated.availableSeats } };
    });
  }, []);

  const { profile, bus, route, stops, eta, alerts, errors } = data;
  const nextStopId = eta?.nextStop?._id;
  const retry = <Button type="button" variant="secondary" className="min-h-12 gap-2" onClick={load} disabled={loading}><RefreshCw size={16} />{loading ? "Refreshing..." : "Refresh dashboard"}</Button>;

  return (
    <>
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">Driver operations</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Driver Dashboard</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3"><p className="break-words text-sm text-[var(--muted)]">{profile.name} | Driver</p><Badge tone="success">Authenticated</Badge></div>
        </div>
        <div className="flex flex-wrap items-center gap-3"><Badge tone={connection === "Connected" ? "success" : "warning"}>Live feed: {connection}</Badge>{retry}</div>
      </header>
      <nav aria-label="Driver navigation" className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
        {[{ href: "/driver/dashboard", label: "Dashboard" }, { href: "/driver/dashboard#driver-map", label: "Route map" }, { href: "/reports", label: "Report an issue" }, { href: "/profile", label: "Profile" }].map((item, index) => <Link key={item.href} href={item.href} aria-current={index === 0 ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4 focus-visible:outline-2 focus-visible:outline-[var(--primary)] ${index === 0 ? "bg-[var(--primary)] text-white" : "bg-white text-[var(--primary)]"}`}>{item.label}</Link>)}
      </nav>
      {(!loading || bus) && !error && (
        <section aria-label="Driver assignment and shift" className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="min-w-0 p-5"><dl><Detail label="Assigned bus" value={bus?.busNumber || "No bus assigned"} /></dl>{bus && <Badge className="mt-3" tone={bus.status === "active" ? "success" : "neutral"}>Bus status: {bus.status}</Badge>}</Card>
          <Card className="min-w-0 p-5"><dl><Detail label="Current route" value={errors.route ? "Unable to load route" : route?.routeName || bus?.route?.routeName || (bus ? "Unavailable" : "No bus assigned")} /></dl>{route && <p className="mt-3 break-words text-sm text-[var(--muted)]">{route.startPoint} to {route.endPoint}</p>}</Card>
          <Card className="min-w-0 p-5"><dl><Detail label="Shift status" value="Unavailable" /></dl><p id="shift-help" className="mt-3 text-sm leading-6 text-[var(--muted)]">Start Shift is currently unavailable because shift management is not supported by the backend.{!bus && " A bus assignment is also required."}</p><Button type="button" disabled aria-describedby="shift-help" className="mt-4 min-h-12 w-full">Start Shift</Button></Card>
        </section>
      )}
      {loading && !bus ? <div className="grid min-h-80 place-items-center"><LoadingSpinner label="Loading assigned bus, route, ETA and alerts..." /></div> : error ? <div className="mt-6"><ErrorState title="Driver information unavailable" description={error} action={retry} /></div> : !bus ? <div className="mt-6"><EmptyState title="No bus assigned" description="No bus is currently assigned to you. Contact the transit team for your assignment." /></div> : (
        <>
          <section aria-label="Stop and arrival information" className="mt-6 grid gap-4 sm:grid-cols-3">
            <Card className="min-w-0 p-5"><dl><Detail label="Current stop" value="Not reported" /></dl><p className="mt-2 text-xs text-[var(--muted)]">Arrival detection advances the next stop automatically. A current stop is not reported.</p></Card>
            <Card className="min-w-0 p-5"><dl><Detail label="Next stop" value={errors.eta ? "Unable to load next stop" : eta?.nextStop?.stopName || "Unavailable"} /></dl></Card>
            <Card className="min-w-0 p-5"><dl><Detail label="ETA to next stop" value={errors.eta ? "Unable to load ETA" : getEtaLabel(eta) || "Unavailable"} /></dl><p className="mt-2 text-xs text-[var(--muted)]">Updated from saved bus location.</p></Card>
          </section>
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <DriverMap bus={bus} stops={stops} nextStopId={nextStopId} connection={connection} />
            <Card className="min-w-0 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">Assigned bus</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><h2 className="break-words text-2xl font-bold">{bus.busNumber}</h2><Badge tone={bus.status === "active" ? "success" : "neutral"}>{bus.status}</Badge></div>
              <dl className="mt-5 grid gap-4 border-t border-[var(--border)] pt-4 text-sm"><Detail label="Route" value={route?.routeName || "Unavailable"} /><Detail label="Available seats" value={`${bus.availableSeats ?? "Unavailable"} / ${bus.capacity}`} /><Detail label="Occupancy" value="Not provided" /><Detail label="Bus trust score" value={bus.trustScore?.score ?? "Unavailable"} /></dl>
              <DriverLocationControl key={bus._id} bus={bus} onUpdate={locationUpdated} />
              <DriverSeatControl key={bus._id} bus={bus} onUpdate={seatsUpdated} />
            </Card>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <DriverRouteCard route={route} stops={stops} nextStopId={nextStopId} errors={errors} />
            <section className="min-w-0" aria-labelledby="alerts-title">
              <h2 id="alerts-title" className="text-xl font-bold">Route alerts</h2>
              <div className="mt-4 grid gap-3">{errors.alerts ? <SectionError label="route alerts" /> : !bus.route ? <p className="text-sm text-[var(--muted)]">No route assigned.</p> : alerts.length ? alerts.map((alert) => <Card key={alert._id} className="break-words border-[#f0d7aa] bg-[#fff9ed] p-4 text-sm text-[#6f531d]">{alert.message}</Card>) : <p className="text-sm text-[var(--muted)]">No active alerts for this route.</p>}</div>
              <Card className="mt-6 p-5"><h2 className="font-bold">Reservations and trip controls</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Driver reservation management and trip start/end controls are currently unavailable.</p><Link href="/reports" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--primary)]">Report a safety or bus condition issue</Link></Card>
            </section>
          </div>
        </>
      )}
    </>
  );
}

function Detail({ label, value }) {
  return <div><dt className="text-sm text-[var(--muted)]">{label}</dt><dd className="mt-1 break-words font-semibold">{value}</dd></div>;
}

function SectionError({ label }) {
  return <p role="alert" className="mt-3 text-sm text-[var(--danger)]">Unable to load {label}. Use Refresh dashboard to try again.</p>;
}
