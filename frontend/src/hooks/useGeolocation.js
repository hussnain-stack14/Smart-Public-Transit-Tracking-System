"use client";

import { useEffect, useState } from "react";

export function useGeolocation(options) {
  const [state, setState] = useState({ position: null, error: null });
  const isSupported = typeof navigator !== "undefined" && Boolean(navigator.geolocation);

  useEffect(() => {
    if (!isSupported) return undefined;
    const updatePosition = (position) => setState({ position, error: null });
    const updateError = (error) => setState((current) => ({ ...current, error }));
    const watchId = navigator.geolocation.watchPosition(updatePosition, updateError, options);
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isSupported, options]);

  return {
    position: state.position,
    error: state.error || (!isSupported ? new Error("Geolocation is not supported by this browser.") : null),
  };
}
