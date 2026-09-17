"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminService } from "../services/adminService";

export function useDriverDirectory({ autoLoad = true } = {}) {
  const sequence = useRef(0);
  const request = useRef(null);
  const [state, setState] = useState({ drivers: [], status: "idle" });
  const refresh = useCallback(async () => {
    const id = ++sequence.current;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setState((current) => ({ ...current, status: "loading" }));
    try {
      const drivers = await adminService.getDrivers({ signal: controller.signal });
      if (!Array.isArray(drivers)) throw new Error("Unexpected driver directory response");
      if (id !== sequence.current) return false;
      setState({ drivers, status: "ready" });
      return true;
    } catch {
      if (id === sequence.current) setState((current) => ({ ...current, status: "error" }));
      return false;
    }
  }, []);
  useEffect(() => {
    let active = true;
    if (autoLoad) queueMicrotask(() => { if (active) refresh(); });
    return () => { active = false; sequence.current += 1; request.current?.abort(); };
  }, [autoLoad, refresh]);
  return { ...state, refresh };
}
