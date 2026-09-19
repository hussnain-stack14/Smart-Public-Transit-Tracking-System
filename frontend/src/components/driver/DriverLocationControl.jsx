"use client";

import { useEffect, useState } from "react";
import { Button } from "../common/Button";
import { busService } from "../../services/busService";

const stoppedState = {
  state: "stopped",
  status: "Start your shift to share location",
  error: "",
};

const startingState = {
  state: "starting",
  status: "Waiting for GPS permission and location...",
  error: "",
};

export function DriverLocationControl({ bus, enabled, onUpdate, onStatusChange }) {
  const [attempt, setAttempt] = useState(0);
  const [gps, setGps] = useState(() => enabled ? startingState : stoppedState);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    const report = (next) => {
      if (!active) return;
      setGps(next);
      onStatusChange(next.state, next.error);
    };

    queueMicrotask(() => {
      if (active) onStatusChange("starting", "");
    });

    if (!window.isSecureContext || !navigator.geolocation) {
      queueMicrotask(() => report({
        state: "error",
        status: "Location unavailable",
        error: "Location sharing requires HTTPS and a browser with geolocation support.",
      }));
      return () => { active = false; };
    }

    let busy = false;
    const controller = new AbortController();
    const watcher = navigator.geolocation.watchPosition(async ({ coords }) => {
      if (!active || busy) return;
      busy = true;
      setGps((current) => ({ ...current, status: "Sending location..." }));
      try {
        const updated = await busService.updateLocation(bus._id, {
          latitude: coords.latitude,
          longitude: coords.longitude,
          ...(coords.speed != null && coords.speed >= 0 ? { speed: coords.speed * 3.6 } : {}),
        }, { signal: controller.signal });
        if (active) {
          onUpdate(updated);
          report({ state: "sharing", status: "Location sharing active", error: "" });
        }
      } catch (requestError) {
        if (active) {
          report({
            state: "error",
            status: "Location update failed",
            error: getLocationRequestError(requestError),
          });
        }
      } finally {
        busy = false;
      }
    }, (locationError) => {
      if (!active) return;
      const permissionDenied = locationError.code === 1;
      report({
        state: permissionDenied ? "permission-denied" : "error",
        status: "Location unavailable",
        error: permissionDenied
          ? "Location permission is required for live bus tracking."
          : locationError.code === 3
            ? "Finding your location timed out. Try again with a clear GPS signal."
            : "Your device cannot determine its location. Check GPS settings and try again.",
      });
    }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 });

    return () => {
      active = false;
      controller.abort();
      navigator.geolocation.clearWatch(watcher);
    };
  }, [enabled, attempt, bus._id, onUpdate, onStatusChange]);

  function retryLocation() {
    setGps(startingState);
    onStatusChange("starting", "");
    setAttempt((value) => value + 1);
  }

  const canRetry = enabled && ["error", "permission-denied"].includes(gps.state);

  return (
    <section className="mt-5 border-t border-[var(--border)] pt-4" aria-labelledby="location-title">
      <h3 id="location-title" className="font-semibold">Live location</h3>
      <p className="mt-2 text-sm" role="status">{gps.status}</p>
      <p className="mt-2 break-words text-xs text-[var(--muted)]">Saved coordinates: {bus.currentLocation?.latitude != null && bus.currentLocation?.longitude != null ? bus.currentLocation.latitude + ", " + bus.currentLocation.longitude : "No location received yet"}</p>
      <p className="mt-2 break-words text-xs text-[var(--muted)]">Last saved: {bus.lastLocationUpdate ? new Date(bus.lastLocationUpdate).toLocaleString() : "No location update received"}</p>
      <Button type="button" className="mt-4 min-h-12 w-full" onClick={retryLocation} disabled={!canRetry}>
        {!enabled ? "Start shift to share location" : canRetry ? "Retry location sharing" : gps.state === "sharing" ? "GPS sharing active" : "Starting GPS..."}
      </Button>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Location sharing starts with an active shift and stops when the shift ends.</p>
      {gps.error && <p role="alert" className="mt-3 text-sm text-[var(--danger)]">{gps.error}</p>}
    </section>
  );
}

function getLocationRequestError(error) {
  const backendMessage = typeof error.response?.data?.message === "string" ? error.response.data.message : "";
  if (backendMessage) return backendMessage;
  if (!error.response) return "Unable to send your location. Check your connection and try again.";
  if (error.response.status === 401) return "Your session has expired. Sign in again.";
  if (error.response.status === 403) return "You no longer have permission to update this bus. Refresh your dashboard.";
  if (error.response.status === 404) return "This bus is no longer available. Refresh your dashboard.";
  if (error.response.status === 409) return "An active shift is required to share location.";
  return "Unable to send your location. Please try again.";
}
