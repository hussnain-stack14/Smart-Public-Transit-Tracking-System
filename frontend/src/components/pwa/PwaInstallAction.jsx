"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download } from "lucide-react";

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function subscribeDisplayMode(callback) {
  const displayMode = window.matchMedia("(display-mode: standalone)");
  displayMode.addEventListener("change", callback);
  return () => displayMode.removeEventListener("change", callback);
}

function subscribeHydration() { return () => {}; }
function clientReady() { return true; }
function serverReady() { return false; }

export function PwaInstallAction({ className = "" }) {
  const hydrated = useSyncExternalStore(subscribeHydration, clientReady, serverReady);
  const standalone = useSyncExternalStore(subscribeDisplayMode, isStandalone, serverReady);
  const [available, setAvailable] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const sync = (event) => setAvailable(Boolean(event.detail?.available));
    const markInstalled = () => {
      setInstalled(true);
      setAvailable(false);
    };
    const availabilityCheck = window.requestAnimationFrame(() => setAvailable(Boolean(window.__smartSafarInstallAvailable)));
    window.addEventListener("smart-safar:install-availability", sync);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      window.cancelAnimationFrame(availabilityCheck);
      window.removeEventListener("smart-safar:install-availability", sync);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  function openInstall() {
    window.dispatchEvent(new Event("smart-safar:open-install"));
  }

  if (!hydrated || standalone || installed || !available) return null;
  return <span className="pwa-install-control"><button type="button" className={`pwa-install-action ${className}`} onClick={openInstall} aria-label="Install Smart Safar" title="Install Smart Safar"><Download size={18} /></button></span>;
}
