"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { BusFront, Wifi, WifiOff, X } from "lucide-react";
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

function isOfflinePublicPath(pathname) {
  return pathname === "/"
    || pathname === "/live-map"
    || pathname === "/routes"
    || /^\/routes\/[^/]+$/.test(pathname)
    || pathname === "/login"
    || pathname === "/register";
}

export function PwaSupport() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [online, setOnline] = useState(true);
  const [showBackOnline, setShowBackOnline] = useState(false);
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
  const connectivityRef = useRef(null);
  const reconnectDelayRef = useRef(null);
  const reconnectDismissRef = useRef(null);
  const lastReconnectNoticeRef = useRef(0);
  const serviceWorkerRegistrationRef = useRef(false);
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
    const finish = () => setLaunchFinished(true);
    // This root-mounted transition runs only once per PWA launch. It is short
    // enough not to delay a ready app, while still giving the logo motion time
    // to read after the operating system splash has closed.
    const completionTimer = window.setTimeout(finish, 650);
    return () => {
      window.clearTimeout(completionTimer);
    };
  }, [showLaunch]);

  useEffect(() => {
    const clearReconnectTimers = () => {
      window.clearTimeout(reconnectDelayRef.current);
      window.clearTimeout(reconnectDismissRef.current);
      reconnectDelayRef.current = null;
      reconnectDismissRef.current = null;
    };
    const syncConnectivity = () => {
      const nextOnline = window.navigator.onLine;
      const previousOnline = connectivityRef.current;
      connectivityRef.current = nextOnline;
      setOnline(nextOnline);

      if (!nextOnline) {
        clearReconnectTimers();
        setShowBackOnline(false);
        return;
      }

      // A short stable-online delay avoids flashing status messages while a
      // mobile connection is bouncing between networks.
      if (previousOnline === false && Date.now() - lastReconnectNoticeRef.current > 5000) {
        clearReconnectTimers();
        reconnectDelayRef.current = window.setTimeout(() => {
          if (!window.navigator.onLine) return;
          lastReconnectNoticeRef.current = Date.now();
          setShowBackOnline(true);
          reconnectDismissRef.current = window.setTimeout(() => setShowBackOnline(false), 4200);
        }, 500);
      }
    };
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

    let hintTimer;
    if (isIOSSafari() && !isStandalone() && !iosHintDismissedRef.current) hintTimer = window.setTimeout(() => setShowIosHint(true), 0);

    return () => {
      window.removeEventListener("online", syncConnectivity);
      window.removeEventListener("offline", syncConnectivity);
      window.removeEventListener("beforeinstallprompt", receiveInstallPrompt);
      window.removeEventListener("appinstalled", markInstalled);
      window.removeEventListener("smart-safar:open-install", openInstall);
      if (hintTimer) window.clearTimeout(hintTimer);
      clearReconnectTimers();
    };
  }, [promptToInstall, installPrompt, installed]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator) || serviceWorkerRegistrationRef.current) return undefined;
    serviceWorkerRegistrationRef.current = true;
    const register = () => navigator.serviceWorker.register("/service-worker.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // A failed registration must never affect transit data or the app shell.
    });
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  useEffect(() => {
    if (!window.navigator.onLine || !isOfflinePublicPath(pathname)) return;
    fetch(pathname, { headers: { Accept: "text/html" } }).catch(() => {
      // The route remains usable online even when warming its offline document fails.
    });
  }, [pathname]);

  useEffect(() => {
    const useCachedDocument = (event) => {
      if (window.navigator.onLine || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest?.("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const target = new URL(link.href, window.location.href);
      if (target.origin !== window.location.origin || !isOfflinePublicPath(target.pathname)) return;
      event.preventDefault();
      window.location.assign(target.pathname + target.search + target.hash);
    };
    document.addEventListener("click", useCachedDocument, true);
    return () => document.removeEventListener("click", useCachedDocument, true);
  }, []);

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
    {!online && <aside className="pwa-connectivity pwa-offline" role="status" aria-live="polite"><WifiOff size={18} aria-hidden="true" /><span><strong>Offline</strong><small>Showing saved transit information where it is available.</small></span></aside>}
    {showBackOnline && online && <aside className="pwa-connectivity pwa-online" role="status" aria-live="polite"><Wifi size={18} aria-hidden="true" /><span><strong>Back online</strong><small>Live transit updates are reconnecting.</small></span></aside>}
    {isPublicHome && !installed && installPrompt && showInstallPrompt && <aside className="pwa-install" role="status" aria-live="polite"><div><strong>Install Smart Safar</strong><span>Add Smart Safar to your home screen for a faster app-like experience.</span></div><button type="button" onClick={promptToInstall} disabled={installing}>{installing ? "Opening..." : "Install"}</button><button type="button" className="pwa-install-close" onClick={dismissInstallPrompt} aria-label="Dismiss install prompt"><X size={17} /></button></aside>}
    {isPublicHome && showIosHint && !installed && <aside className="pwa-ios-install" role="status" aria-label="Install Smart Safar"><div><strong>Install Smart Safar</strong><span>To install: Share, then Add to Home Screen</span></div><button type="button" className="pwa-ios-install-close" onClick={dismissIosHint} aria-label="Dismiss install instructions"><X size={17} /></button></aside>}
  </>;
}
