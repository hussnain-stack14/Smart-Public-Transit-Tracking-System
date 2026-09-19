"use client";

import { useEffect, useState } from "react";

export function useGeolocation(options, settings = {}) {
  const { enabled = true, oneShot = false, refreshKey = 0 } = settings;
  const [state, setState] = useState({ position: null, error: null, loading: false });
  const isSupported = typeof navigator !== "undefined" && Boolean(navigator.geolocation);

  useEffect(() => {
    if (!enabled || !isSupported) return undefined;

    let active = true;
    const updatePosition = (position) => {
      if (active) setState({ position, error: null, loading: false });
    };
    const updateError = (error) => {
      if (active) setState((current) => ({ ...current, error, loading: false }));
    };

    queueMicrotask(() => {
      if (active) setState((current) => ({ ...current, error: null, loading: true }));
    });

    if (oneShot) {
      navigator.geolocation.getCurrentPosition(updatePosition, updateError, options);
      return () => {
        active = false;
      };
    }

    const watchId = navigator.geolocation.watchPosition(updatePosition, updateError, options);
    return () => {
      active = false;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled, isSupported, oneShot, options, refreshKey]);

  return {
    position: state.position,
    error:
      state.error ||
      (enabled && !isSupported ? new Error("Geolocation is not supported by this browser.") : null),
    loading: state.loading,
    isSupported,
  };
}