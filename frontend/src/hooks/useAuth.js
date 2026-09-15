"use client";

import { useSyncExternalStore } from "react";
import { getAccessToken } from "../lib/auth/token";

function subscribe(callback) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useAuth() {
  const token = useSyncExternalStore(subscribe, getAccessToken, () => null);

  return { token, isAuthenticated: Boolean(token), isLoading: false };
}
