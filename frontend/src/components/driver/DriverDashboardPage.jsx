"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Navbar } from "../navigation/Navbar";
import { Footer } from "../navigation/Footer";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { EmptyState } from "../common/EmptyState";
import { ErrorState } from "../common/ErrorState";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ProtectedPage } from "../common/ProtectedPage";
import { DriverMap } from "./DriverMap";
import { DriverPassengerPanel } from "./DriverPassengerPanel";
import { DriverRouteCard } from "./DriverRouteCard";
import { DriverLocationControl } from "./DriverLocationControl";
import { DriverSeatControl } from "./DriverSeatControl";
import { useSocket } from "../../hooks/useSocket";
import { busService } from "../../services/busService";
import { bookingService } from "../../services/bookingService";
import { routeService } from "../../services/routeService";
import { stopService } from "../../services/stopService";
import { alertService } from "../../services/alertService";
import { getProfile } from "../../services/authService";
import { DriverStatusCard } from "./DriverStatusCard";
import { getBusDirection, getDirectionLabel, getStopsInDirection } from "../../lib/transit/direction";
import { hasRole, ROLES } from "../../lib/auth/permissions";
import { getAccessToken } from "../../lib/auth/token";

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
  const passengerRequestId = useRef(0);
  const returnInFlight = useRef(false);
  const shiftInFlight = useRef(false);
  const [data, setData] = useState({ profile: user, bus: null, route: null, stops: [], eta: null, alerts: [], errors: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState(socket.connected ? "Connected" : "Connecting");
  const [returnBusy, setReturnBusy] = useState(false);
  const [returnError, setReturnError] = useState("");
  const [shiftBusy, setShiftBusy] = useState("");
  const [shiftError, setShiftError] = useState("");
  const [shiftCompleted, setShiftCompleted] = useState(false);
  const [gpsStatus, setGpsStatus] = useState({ state: "stopped", message: "" });
  const [passengerLocations, setPassengerLocations] = useState([]);
  const [passengerLoading, setPassengerLoading] = useState(false);
  const [passengerError, setPassengerError] = useState("");

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
      if (id === requestId.current && profile.activeShift) setShiftCompleted(false);
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
  const activeShift = data.profile.activeShift?.status === "active" ? data.profile.activeShift : null;
  const shiftActive = Boolean(activeShift);

  const loadPassengerLocations = useCallback(async () => {
    if (!shiftActive || !busId) return;
    const id = ++passengerRequestId.current;
    setPassengerLoading(true);
    setPassengerError("");
    try {
      const response = await bookingService.getAssignedPassengerLocations();
      if (id !== passengerRequestId.current) return;
      const locations = Array.isArray(response) ? response : response.locations || [];
      setPassengerLocations(locations);
    } catch (requestError) {
      if (id !== passengerRequestId.current) return;
      const message =
        requestError.response?.data?.message ||
        "Unable to load passenger pickup locations. Check your connection and try again.";
      setPassengerError(message);
    } finally {
      if (id === passengerRequestId.current) setPassengerLoading(false);
    }
  }, [busId, shiftActive]);

  useEffect(() => {
    if (!shiftActive || !busId) {
      passengerRequestId.current += 1;
      let active = true;
      queueMicrotask(() => {
        if (!active) return;
        setPassengerLocations([]);
        setPassengerError("");
        setPassengerLoading(false);
      });
      return () => {
        active = false;
      };
    }

    let active = true;
    Promise.resolve().then(() => {
      if (active) loadPassengerLocations();
    });

    const watch = () => {
      const token = getAccessToken();
      if (!token) {
        setPassengerError("Your session token is unavailable. Sign in again.");
        return;
      }
      socket.emit("watchDriverBookings", { token }, (result) => {
        if (!active) return;
        if (!result?.ok) {
          setPassengerError(result?.message || "Unable to watch passenger pickup updates.");
          return;
        }
        loadPassengerLocations();
      });
    };
    const update = (event) => {
      if (!event?.bookingId) return;
      if (!event.sharing) {
        setPassengerLocations((current) =>
          current.filter((item) => String(item.bookingId) !== String(event.bookingId)),
        );
        return;
      }
      if (!Number.isFinite(event.latitude) || !Number.isFinite(event.longitude)) return;
      const next = {
        bookingId: event.bookingId,
        passenger: event.passenger,
        pickupLocation: {
          latitude: event.latitude,
          longitude: event.longitude,
          accuracy: event.accuracy,
          timestamp: event.timestamp,
        },
      };
      setPassengerLocations((current) => {
        const exists = current.some(
          (item) => String(item.bookingId) === String(event.bookingId),
        );
        return exists
          ? current.map((item) =>
              String(item.bookingId) === String(event.bookingId) ? next : item,
            )
          : [next, ...current];
      });
    };
    const accessEnded = () => {
      passengerRequestId.current += 1;
      setPassengerLocations([]);
      setPassengerError("");
    };

    socket.on("passengerLocationUpdate", update);
    socket.on("passengerLocationAccessEnded", accessEnded);
    socket.on("connect", watch);
    if (socket.connected) watch();

    return () => {
      active = false;
      passengerRequestId.current += 1;
      socket.off("passengerLocationUpdate", update);
      socket.off("passengerLocationAccessEnded", accessEnded);
      socket.off("connect", watch);
      socket.emit("unwatchDriverBookings");
    };
  }, [socket, busId, shiftActive, loadPassengerLocations]);

  useEffect(() => {
    const watch = () => {
      if (busId) socket.emit("watchBus", busId);
    };
    const connected = () => { setConnection("Connected"); watch(); };
    const disconnected = () => setConnection("Disconnected");
    const failed = () => setConnection("Reconnecting");
    const update = (location) => {
      if (String(location.busId) !== String(busId)) return;
      if (location.status === "idle") {
        setShiftCompleted(true);
        setGpsStatus({ state: "stopped", message: "" });
        setPassengerLocations([]);
      }
      setData((current) => {
        if (String(current.bus?._id) !== String(location.busId)) return current;
        const hasCoordinates = location.latitude != null && location.longitude != null;
        const hasEta = Object.hasOwn(location, "currentStop") || Object.hasOwn(location, "nextStop") || Object.hasOwn(location, "etaMinutes");
        return {
          ...current,
          profile: location.status === "idle" ? { ...current.profile, activeShift: null } : current.profile,
          bus: {
            ...current.bus,
            ...(hasCoordinates ? { currentLocation: { latitude: location.latitude, longitude: location.longitude } } : {}),
            ...(location.lastLocationUpdate ? { lastLocationUpdate: location.lastLocationUpdate } : {}),
            status: location.status || current.bus.status,
            direction: location.direction || current.bus.direction,
          },
          eta: hasEta ? { ...current.eta, direction: location.direction, currentStop: location.currentStop, nextStop: location.nextStop, etaMinutes: location.etaMinutes, distanceKm: location.distanceKm, terminalReached: location.terminalReached } : current.eta,
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
        eta: { direction: updated.direction, currentStop: updated.currentStop, nextStop: updated.nextStop, etaMinutes: updated.etaMinutes, distanceKm: updated.distanceKm, terminalReached: updated.terminalReached },
        errors: { ...current.errors, eta: false },
      };
    });
  }, []);

  const locationStatusChanged = useCallback((state, message) => {
    setGpsStatus({ state, message });
  }, []);

  const startShift = useCallback(async () => {
    if (shiftInFlight.current) return;
    shiftInFlight.current = true;
    setShiftBusy("starting");
    setShiftError("");
    try {
      const result = await busService.startShift();
      setShiftCompleted(false);
      setGpsStatus({ state: "starting", message: "" });
      setData((current) => ({
        ...current,
        profile: { ...current.profile, activeShift: result.shift },
        bus: { ...current.bus, ...result.shift.bus },
        route: current.route || result.shift.route,
      }));
      await load();
    } catch (requestError) {
      setShiftError(getShiftRequestError(requestError, "start"));
      if (requestError.response?.status === 409) await load();
    } finally {
      shiftInFlight.current = false;
      setShiftBusy("");
    }
  }, [load]);

  const endShift = useCallback(async () => {
    if (shiftInFlight.current) return;
    shiftInFlight.current = true;
    setShiftBusy("ending");
    setShiftError("");
    try {
      const result = await busService.endShift();
      setData((current) => ({
        ...current,
        profile: { ...current.profile, activeShift: null },
        bus: { ...current.bus, ...result.shift.bus },
      }));
      setGpsStatus({ state: "stopped", message: "" });
      setShiftCompleted(true);
      setPassengerLocations([]);
      await load();
    } catch (requestError) {
      setShiftError(getShiftRequestError(requestError, "end"));
      if (requestError.response?.status === 409) await load();
    } finally {
      shiftInFlight.current = false;
      setShiftBusy("");
    }
  }, [load]);

  const startReturnTrip = useCallback(async () => {
    if (returnInFlight.current) return;
    returnInFlight.current = true;
    setReturnBusy(true);
    setReturnError("");
    try {
      const updated = await busService.startReturnTrip();
      setData((current) => ({
        ...current,
        bus: current.bus?._id === updated._id ? { ...current.bus, ...updated } : current.bus,
        eta: { direction: updated.direction, currentStop: updated.currentStop, nextStop: updated.nextStop, etaMinutes: updated.etaMinutes, distanceKm: updated.distanceKm, terminalReached: updated.terminalReached },
        errors: { ...current.errors, eta: false },
      }));
    } catch (requestError) {
      setReturnError(requestError.response?.data?.message || "Unable to start the return trip. Try again.");
    } finally {
      returnInFlight.current = false;
      setReturnBusy(false);
    }
  }, []);
  const seatsUpdated = useCallback((updated) => {
    setData((current) => {
      if (current.bus?._id !== updated._id) return current;
      return { ...current, bus: { ...current.bus, availableSeats: updated.availableSeats } };
    });
  }, []);

  const { profile, bus, route, stops, eta, alerts, errors } = data;

  const hasRouteAssignment = Boolean(bus?.route?._id || bus?.route);
  const direction = getBusDirection(bus);
  const directionalStops = getStopsInDirection(stops, direction);
  const directionLabel = getDirectionLabel(route, direction);
  const nextStopId = eta?.nextStop?._id;
  const retry = <Button type="button" variant="secondary" className="min-h-12 gap-2" onClick={load} disabled={loading}><RefreshCw size={16} />{loading ? "Refreshing..." : "Refresh dashboard"}</Button>;

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0"><h1 className="text-2xl font-bold">Driver Dashboard</h1><p className="mt-1 break-words text-sm text-[var(--muted)]">{profile.name}</p></div>
        {retry}
      </header>
      {bus && !error && <DriverStatusCard bus={bus} route={route} eta={eta} errors={errors} direction={direction} directionLabel={directionLabel} shiftActive={shiftActive} shiftCompleted={shiftCompleted} shiftBusy={shiftBusy} shiftError={shiftError} hasRouteAssignment={hasRouteAssignment} gpsStatus={gpsStatus} onShift={shiftActive ? endShift : startShift} returnBusy={returnBusy} returnError={returnError} onReturn={startReturnTrip}>
        <DriverLocationControl key={`location-${bus._id}-${activeShift?._id || "inactive"}`} bus={bus} enabled={shiftActive} onUpdate={locationUpdated} onStatusChange={locationStatusChanged} />
      </DriverStatusCard>}
      {loading && !bus ? <div className="grid min-h-80 place-items-center"><LoadingSpinner label="Loading assigned bus, route, ETA and alerts..." /></div> : error ? <div className="mt-6"><ErrorState title="Driver information unavailable" description={error} action={retry} /></div> : !bus ? <div className="mt-6"><EmptyState title="No Bus Assigned" description="Please contact the administrator to get a bus assigned before starting a shift." /></div> : (
        <>
          <div className="driver-main-grid mt-4 grid items-start gap-4 md:grid-cols-2">
            <Card className="min-w-0 p-5">
              <h2 className="font-bold">Bus controls</h2>
              <DriverSeatControl key={`seats-${bus._id}`} bus={bus} onUpdate={seatsUpdated} />
            </Card>
            <DriverMap bus={bus} stops={directionalStops} nextStopId={nextStopId} connection={connection} passengers={passengerLocations} />
          </div>
          <div className="driver-detail-grid mt-4 grid items-start gap-4 md:grid-cols-2">
            <DriverRouteCard route={route} stops={directionalStops} nextStopId={nextStopId} errors={errors} />
            <section className="min-w-0" aria-labelledby="alerts-title">
              <h2 id="alerts-title" className="text-xl font-bold">Route alerts</h2>
              <div className="mt-4 grid gap-3">{errors.alerts ? <SectionError label="route alerts" /> : !bus.route ? <p className="text-sm text-[var(--muted)]">No route assigned.</p> : alerts.length ? alerts.map((alert) => <Card key={alert._id} className="break-words border-[#f0d7aa] bg-[#fff9ed] p-4 text-sm text-[#6f531d]">{alert.message}</Card>) : <p className="text-sm text-[var(--muted)]">No active alerts for this route.</p>}</div>
              <div id="driver-passengers" className="mt-6 scroll-mt-20"><DriverPassengerPanel active={shiftActive} passengers={passengerLocations} loading={passengerLoading} error={passengerError} onRetry={loadPassengerLocations} /></div><Link href="/reports" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--primary-ink)]">Report a safety or bus condition issue</Link>
            </section>
          </div>
        </>
      )}
    </>
  );
}

function SectionError({ label }) {
  return <p role="alert" className="mt-3 text-sm text-[var(--danger)]">Unable to load {label}. Use Refresh dashboard to try again.</p>;
}

function getShiftRequestError(error, action) {
  const backendMessage = typeof error.response?.data?.message === "string" ? error.response.data.message : "";
  if (backendMessage) return backendMessage;
  if (!error.response) return `Unable to ${action} the shift. Check your connection and try again.`;
  if (error.response.status === 401) return "Your session has expired. Sign in again.";
  if (error.response.status === 403) return "Your account is not authorized to manage driver shifts.";
  if (error.response.status === 404) return "Your assigned bus could not be found. Refresh the dashboard or contact the administrator.";
  if (error.response.status === 409) return action === "start" ? "A shift is already active for this driver or bus." : "No active shift was found.";
  return `Unable to ${action} the shift. Please try again.`;
}
