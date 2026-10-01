"use client";

import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT = "https://accounts.google.com/gsi/client";
let googleScriptPromise;

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;
  googleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Google sign-in could not be loaded."));
    document.head.appendChild(script);
  });
  return googleScriptPromise;
}

export function GoogleSignIn({ disabled, onCredential, onError }) {
  const mount = useRef(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!clientId || !mount.current) return undefined;
    let active = true;
    loadGoogleScript().then(() => {
      if (!active || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (!response.credential) onError("Google sign-in was cancelled or did not return a credential.");
          else onCredential(response.credential);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      window.google.accounts.id.renderButton(mount.current, { theme: "outline", size: "large", text: "continue_with", shape: "rect", width: 360 });
    }).catch(() => { if (active) setUnavailable(true); });
    return () => { active = false; };
  }, [clientId, onCredential, onError]);

  if (!clientId) return <div className="grid gap-2"><button type="button" disabled aria-describedby="google-config-status" className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-white text-sm font-semibold text-[var(--muted)]">Continue with Google</button><p id="google-config-status" className="text-center text-xs leading-5 text-[var(--muted)]">Google OAuth is not configured for this deployment. Use email and password.</p></div>;
  if (unavailable) return <p className="text-center text-xs leading-5 text-[var(--danger)]">Google sign-in is unavailable right now. Please use email and password.</p>;
  return <div className={disabled ? "pointer-events-none opacity-60" : ""} aria-disabled={disabled}><div ref={mount} className="flex min-h-11 justify-center" /></div>;
}