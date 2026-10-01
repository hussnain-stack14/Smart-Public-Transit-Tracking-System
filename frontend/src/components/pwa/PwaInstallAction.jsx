"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIOSSafari() {
  const userAgent = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent)
    || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  return isIOS && /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
}

export function PwaInstallAction({ className = "" }) {
  const [available, setAvailable] = useState(() => typeof window !== "undefined" && Boolean(window.__smartSafarInstallAvailable));
  const [installed, setInstalled] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const sync = (event) => setAvailable(Boolean(event.detail?.available));
    const markInstalled = () => {
      setInstalled(true);
      setAvailable(false);
      setFeedback("");
    };
    const standaloneCheck = window.requestAnimationFrame(() => setInstalled(isStandalone()));
    window.addEventListener("smart-safar:install-availability", sync);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      window.cancelAnimationFrame(standaloneCheck);
      window.removeEventListener("smart-safar:install-availability", sync);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = window.setTimeout(() => setFeedback(""), 5000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  function openInstall() {
    if (available) window.dispatchEvent(new Event("smart-safar:open-install"));

    if (isIOSSafari()) {
      setFeedback("Use Share, then Add to Home Screen to install Smart Safar.");
    } else if (!available) {
      setFeedback("App installation is not available in this browser right now.");
    }
  }

  if (installed) return null;
  return <span className="pwa-install-control"><button type="button" className={`pwa-install-action ${className}`} onClick={openInstall} aria-label="Install Smart Safar" title="Install Smart Safar"><Download size={18} /></button>{feedback && <span className="pwa-install-feedback" role="status">{feedback}</span>}</span>;
}
