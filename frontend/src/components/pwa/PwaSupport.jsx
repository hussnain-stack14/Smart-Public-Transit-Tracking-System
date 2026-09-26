"use client";

import { useEffect, useState } from "react";

const IOS_HINT_DISMISSED = "smart-safar:ios-install-hint-dismissed";

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIOSBrowser() {
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent)
    || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
}

export function PwaSupport() {
  const [online, setOnline] = useState(true);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    const syncConnectivity = () => setOnline(window.navigator.onLine);
    syncConnectivity();
    window.addEventListener("online", syncConnectivity);
    window.addEventListener("offline", syncConnectivity);

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      const register = () => {
        navigator.serviceWorker.register("/service-worker.js", {
          scope: "/",
          updateViaCache: "none",
        }).catch(() => {
          // A failed registration must never affect transit data or the app shell.
        });
      };
      window.addEventListener("load", register, { once: true });
      if (document.readyState === "complete") register();
    }

    try {
      if (isIOSBrowser() && !isStandalone() && !window.localStorage.getItem(IOS_HINT_DISMISSED)) {
        setShowIosHint(true);
      }
    } catch {
      // Private browsing can restrict storage; the install hint remains optional.
    }

    return () => {
      window.removeEventListener("online", syncConnectivity);
      window.removeEventListener("offline", syncConnectivity);
    };
  }, []);

  function dismissIosHint() {
    setShowIosHint(false);
    try {
      window.localStorage.setItem(IOS_HINT_DISMISSED, "true");
    } catch {
      // The message is deliberately non-essential if storage is unavailable.
    }
  }

  return <>
    {!online && <section className="pwa-offline" role="alert" aria-live="assertive">
      <img src="/smart-transit-logo.svg" width="72" height="72" alt="Smart Safar" />
      <h1>You&apos;re offline</h1>
      <p>Some Smart Safar features need an internet connection.</p>
      <p className="pwa-offline-note">Live buses, ETAs, bookings, alerts, and driver updates are unavailable until you&apos;re back online.</p>
    </section>}
    {showIosHint && <aside className="pwa-ios-install" role="status" aria-label="Install Smart Safar">
      <div><strong>Install Smart Safar</strong><span>To install: Share → Add to Home Screen</span></div>
      <button type="button" onClick={dismissIosHint} aria-label="Dismiss install instructions">Not now</button>
    </aside>}
  </>;
}
