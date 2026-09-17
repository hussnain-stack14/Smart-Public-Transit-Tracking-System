"use client";

import { useEffect, useState } from "react";
import { Button } from "../common/Button";
import { busService } from "../../services/busService";

export function DriverLocationControl({ bus, onUpdate }) {
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState("Location sharing stopped");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sharing) return;
    let active = true;
    let busy = false;
    const controller = new AbortController();
    const watcher = navigator.geolocation.watchPosition(async ({ coords }) => {
      if (!active || busy) return;
      busy = true;
      setStatus("Sending location...");
      try {
        const updated = await busService.updateLocation(bus._id, {
          latitude: coords.latitude,
          longitude: coords.longitude,
          ...(coords.speed != null && coords.speed >= 0 ? { speed: coords.speed * 3.6 } : {}),
        }, { signal: controller.signal });
        if (active) {
          onUpdate(updated);
          setError("");
          setStatus("Location sharing active");
        }
      } catch (requestError) {
        if (active) {
          setStatus("Location update failed");
          setError(requestError.response?.status === 404 ? "This bus is no longer available. Refresh your dashboard." : requestError.response?.status === 403 ? "You no longer have permission to update this bus. Refresh your dashboard." : "Unable to send your location. Check your connection and try again.");
        }
      } finally {
        busy = false;
      }
    }, (locationError) => {
      if (!active) return;
      setSharing(false);
      setStatus("Location unavailable");
      setError(locationError.code === 1 ? "Location permission was denied. Enable it in your browser settings and try again." : locationError.code === 3 ? "Finding your location timed out. Try again with a clear GPS signal." : "Your device cannot determine its location. Check GPS settings and try again.");
    }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 });
    return () => {
      active = false;
      controller.abort();
      navigator.geolocation.clearWatch(watcher);
    };
  }, [sharing, bus._id, onUpdate]);

  function toggleSharing() {
    setError("");
    if (sharing) {
      setSharing(false);
      setStatus("Location sharing stopped");
    } else if (!window.isSecureContext || !navigator.geolocation) {
      setStatus("Location unavailable");
      setError("Location sharing requires HTTPS and a browser with geolocation support.");
    } else {
      setStatus("Waiting for GPS permission and location...");
      setSharing(true);
    }
  }

  return (
    <section className="mt-5 border-t border-[var(--border)] pt-4" aria-labelledby="location-title">
      <h3 id="location-title" className="font-semibold">Live location</h3>
      <p className="mt-2 text-sm" role="status">{status}</p>
      <p className="mt-2 break-words text-xs text-[var(--muted)]">Saved coordinates: {bus.currentLocation?.latitude != null && bus.currentLocation?.longitude != null ? bus.currentLocation.latitude + ", " + bus.currentLocation.longitude : "No location received yet"}</p>
      <p className="mt-2 break-words text-xs text-[var(--muted)]">Last saved: {bus.lastLocationUpdate ? new Date(bus.lastLocationUpdate).toLocaleString() : "No location update received"}</p>
      <Button type="button" className="mt-4 min-h-12 w-full" onClick={toggleSharing}>{sharing ? "Stop location sharing" : "Start location sharing"}</Button>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Sharing saves your location and marks the bus active. Stopping sharing does not end a shift or change the saved bus status.</p>
      {error && <p role="alert" className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
    </section>
  );
}
