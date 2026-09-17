"use client";

import { useSyncExternalStore } from "react";
import { AUTH_CHANGE_EVENT, getAccessToken } from "../lib/auth/token";

function subscribe(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
  };
}

export function useAuth() {
  const token = useSyncExternalStore(subscribe, getAccessToken, () => null);
  return { token, isAuthenticated: Boolean(token), isLoading: false };
}