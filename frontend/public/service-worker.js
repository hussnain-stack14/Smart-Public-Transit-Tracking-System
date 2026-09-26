/* Smart Safar intentionally caches only public, versioned application assets. */
const CACHE_NAME = "smart-safar-static-v1";
const STATIC_ASSETS = [
  "/offline.html",
  "/manifest.webmanifest",
  "/smart-transit-logo.svg",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(
    names.filter((name) => name.startsWith("smart-safar-") && name !== CACHE_NAME).map((name) => caches.delete(name)),
  )).then(() => self.clients.claim()));
});

function isSafeStaticAsset(url) {
  return STATIC_ASSETS.includes(url.pathname) || url.pathname.startsWith("/_next/static/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (request.mode === "navigate") {
    // Never cache pages: they may contain authenticated or live transit information.
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  // API responses, Socket.IO traffic, map tiles, and third-party traffic always use the network.
  if (url.origin !== self.location.origin || !isSafeStaticAsset(url)) return;

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (!response || !response.ok) return response;
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    return response;
  })));
});
