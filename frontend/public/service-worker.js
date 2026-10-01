/* Public shell and public transit snapshots only. Private sessions, bookings,
   live sockets, map tiles, and mutations are deliberately never cached. */
const SHELL_CACHE = "smart-safar-shell-v3";
const TRANSIT_CACHE = "smart-safar-transit-v3";
const STATIC_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/smart-transit-logo.svg",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/apple-touch-icon.png",
];
const PUBLIC_PAGES = new Set(["/", "/live-map", "/routes", "/login", "/register"]);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(names.filter((name) => name.startsWith("smart-safar-") && ![SHELL_CACHE, TRANSIT_CACHE].includes(name)).map((name) => caches.delete(name)))).then(() => self.clients.claim()));
});

function isStaticAsset(url) {
  return url.origin === self.location.origin && (STATIC_ASSETS.includes(url.pathname) || url.pathname.startsWith("/_next/static/"));
}

function isTransitSnapshot(url) {
  return /\/api\/(?:routes|buses)(?:\/|$)/.test(url.pathname) || /\/api\/stops\/route\//.test(url.pathname);
}

function normalizedCacheRequest(request) {
  const url = new URL(request.url);
  return new Request(url.origin + url.pathname + url.search, { method: "GET" });
}

async function networkFirstShell(request) {
  try {
    const response = await fetch(request);
    if (response?.ok) (await caches.open(SHELL_CACHE)).put(request, response.clone());
    return response;
  } catch {
    return (await caches.match(request)) || (await caches.match("/")) || (await caches.match("/offline.html"));
  }
}

async function networkFirstTransit(request) {
  const cacheKey = normalizedCacheRequest(request);
  try {
    const response = await fetch(request);
    if (response?.ok && response.type !== "opaque") (await caches.open(TRANSIT_CACHE)).put(cacheKey, response.clone());
    return response;
  } catch {
    const cached = await caches.open(TRANSIT_CACHE).then((cache) => cache.match(cacheKey));
    return cached || new Response("Transit data is unavailable offline.", { status: 503, statusText: "Offline" });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (isTransitSnapshot(url)) {
    event.respondWith(networkFirstTransit(request));
    return;
  }
  if (request.mode === "navigate" && url.origin === self.location.origin) {
    event.respondWith(PUBLIC_PAGES.has(url.pathname) ? networkFirstShell(request) : fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }
  if (isStaticAsset(url)) event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response?.ok) caches.open(SHELL_CACHE).then((cache) => cache.put(request, response.clone()));
    return response;
  })));
});