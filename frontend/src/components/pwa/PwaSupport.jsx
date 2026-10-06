"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { BusFront, WifiOff, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function subscribeDisplayMode(callback) {
  const displayMode = window.matchMedia("(display-mode: standalone)");
  displayMode.addEventListener("change", callback);
  return () => displayMode.removeEventListener("change", callback);
}

function serverStandalone() { return false; }

function isIOSSafari() {
  const userAgent = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent)
    || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  return isIOS && /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
}

function publishInstallAvailability(available) {
  window.__smartSafarInstallAvailable = available;
  window.dispatchEvent(new CustomEvent("smart-safar:install-availability", { detail: { available } }));
}

export function PwaSupport() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [online, setOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(true);
  const [installing, setInstalling] = useState(false);
  const standalone = useSyncExternalStore(subscribeDisplayMode, isStandalone, serverStandalone);
  const [appInstalled, setInstalled] = useState(false);
  const installed = standalone || appInstalled;
  const [showIosHint, setShowIosHint] = useState(false);
  const [launchFinished, setLaunchFinished] = useState(false);
  const showLaunch = standalone && !launchFinished;
  const installPromptDismissedRef = useRef(false);
  const iosHintDismissedRef = useRef(false);
  const isPublicHome = pathname === "/" && !isAuthenticated;

  const promptToInstall = useCallback(async () => {
    if (installed) return;
    if (!installPrompt) {
      if (isIOSSafari() && !installed) setShowIosHint(true);
      return;
    }

    setInstalling(true);
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } catch {
      // Dismissing the browser prompt is not an application error.
    } finally {
      setInstallPrompt(null);
      setInstalling(false);
      publishInstallAvailability(false);
    }
  }, [installPrompt, installed]);

  useEffect(() => {
    if (!showLaunch) return undefined;
    let completionTimer;
    const finish = () => setLaunchFinished(true);
    const onLoad = () => { completionTimer = window.setTimeout(finish, 850); };

    if (document.readyState === "complete") completionTimer = window.setTimeout(finish, 0);
    else window.addEventListener("load", onLoad, { once: true });

    const safetyTimer = window.setTimeout(finish, 1300);
    return () => {
      window.removeEventListener("load", onLoad);
      window.clearTimeout(completionTimer);
      window.clearTimeout(safetyTimer);
    };
  }, [showLaunch]);

  useEffect(() => {
    const syncConnectivity = () => setOnline(window.navigator.onLine);
    const receiveInstallPrompt = (event) => {
      event.preventDefault();
      if (isStandalone()) { publishInstallAvailability(false); return; }
      setInstallPrompt(event);
      if (!installPromptDismissedRef.current) setShowInstallPrompt(true);
      publishInstallAvailability(true);
    };
    const markInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowInstallPrompt(false);
      setShowIosHint(false);
      publishInstallAvailability(false);
    };
    const openInstall = () => promptToInstall();

    syncConnectivity();
    publishInstallAvailability(!installed && (Boolean(installPrompt) || (isIOSSafari() && !isStandalone())));
    window.addEventListener("online", syncConnectivity);
    window.addEventListener("offline", syncConnectivity);
    window.addEventListener("beforeinstallprompt", receiveInstallPrompt);
    window.addEventListener("appinstalled", markInstalled);
    window.addEventListener("smart-safar:open-install", openInstall);

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      const register = () => navigator.serviceWorker.register("/service-worker.js", { scope: "/", updateViaCache: "none" }).catch(() => {
        // A failed registration must never affect transit data or the app shell.
      });
      window.addEventListener("load", register, { once: true });
      if (document.readyState === "complete") register();
    }

    let hintTimer;
    if (isIOSSafari() && !isStandalone() && !iosHintDismissedRef.current) hintTimer = window.setTimeout(() => setShowIosHint(true), 0);

    return () => {
      window.removeEventListener("online", syncConnectivity);
      window.removeEventListener("offline", syncConnectivity);
      window.removeEventListener("beforeinstallprompt", receiveInstallPrompt);
      window.removeEventListener("appinstalled", markInstalled);
      window.removeEventListener("smart-safar:open-install", openInstall);
      if (hintTimer) window.clearTimeout(hintTimer);
    };
  }, [promptToInstall, installPrompt, installed]);

  function dismissInstallPrompt() {
    installPromptDismissedRef.current = true;
    setShowInstallPrompt(false);
  }

  function dismissIosHint() {
    iosHintDismissedRef.current = true;
    setShowIosHint(false);
  }

  return <>
    {showLaunch && <section className="pwa-launch" aria-label="Opening Smart Safar"><div className="pwa-launch__scene"><Image src="/smart-transit-logo.svg" width={56} height={56} alt="" priority /><span className="pwa-launch__route" aria-hidden="true"><span><BusFront size={22} /></span></span><strong>Smart Safar</strong><p>Smart Public Transit for Faisalabad</p></div></section>}
    {!online && <aside className="pwa-offline" role="status" aria-live="polite"><WifiOff size={18} aria-hidden="true" /><span><strong>Offline</strong><small>Showing saved transit information where it is available.</small></span></aside>}
    {isPublicHome && !installed && installPrompt && showInstallPrompt && <aside className="pwa-install" role="status" aria-live="polite"><div><strong>Install Smart Safar</strong><span>Add Smart Safar to your home screen for a faster app-like experience.</span></div><button type="button" onClick={promptToInstall} disabled={installing}>{installing ? "Opening..." : "Install"}</button><button type="button" className="pwa-install-close" onClick={dismissInstallPrompt} aria-label="Dismiss install prompt"><X size={17} /></button></aside>}
    {isPublicHome && showIosHint && !installed && <aside className="pwa-ios-install" role="status" aria-label="Install Smart Safar"><div><strong>Install Smart Safar</strong><span>To install: Share, then Add to Home Screen</span></div><button type="button" className="pwa-ios-install-close" onClick={dismissIosHint} aria-label="Dismiss install instructions"><X size={17} /></button></aside>}
  </>;
}
