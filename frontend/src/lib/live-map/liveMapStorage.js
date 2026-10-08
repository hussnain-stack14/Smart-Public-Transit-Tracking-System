const DB_NAME = "smart-safar-live-map";
const STORE_NAME = "snapshots";
const MAP_STATE_KEY = "map-state";
const TRANSIT_SNAPSHOT_KEY = "transit-snapshot";
const ROUTE_CATALOGUE_KEY = "route-catalogue";
const MAX_CACHED_ROUTE_DETAILS = 50;

function openStore(mode) {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result.transaction(STORE_NAME, mode).objectStore(STORE_NAME));
  });
}

async function read(key) {
  if (typeof window === "undefined" || !window.indexedDB) return null;
  try {
    const store = await openStore("readonly");
    return await new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

async function write(key, data) {
  if (typeof window === "undefined" || !window.indexedDB) return;
  try {
    const store = await openStore("readwrite");
    await new Promise((resolve, reject) => {
      const request = store.put({ data, cachedAt: Date.now() }, key);
      request.onsuccess = resolve;
      request.onerror = reject;
    });
  } catch {
    // Offline support remains optional when storage is disabled by the browser.
  }
}

export function readLiveMapState() { return read(MAP_STATE_KEY); }
export async function saveLiveMapState(state) {
  const current = await read(MAP_STATE_KEY);
  return write(MAP_STATE_KEY, { ...(current?.data || {}), ...state });
}
export function saveLiveMapViewport(mapViewport) { return saveLiveMapState({ mapViewport }); }
export function readTransitSnapshot() { return read(TRANSIT_SNAPSHOT_KEY); }
export function saveTransitSnapshot(snapshot) { return write(TRANSIT_SNAPSHOT_KEY, snapshot); }

export function readCachedRoutes() { return read(ROUTE_CATALOGUE_KEY); }

export async function saveCachedRoutes(routes) {
  const current = await read(ROUTE_CATALOGUE_KEY);
  return write(ROUTE_CATALOGUE_KEY, { routes, details: current?.data?.details || {} });
}

export async function readCachedRouteDetails(routeId) {
  const current = await read(ROUTE_CATALOGUE_KEY);
  return current?.data?.details?.[String(routeId)] || null;
}

export async function saveCachedRouteDetails(routeId, details) {
  const current = await read(ROUTE_CATALOGUE_KEY);
  const entries = { ...(current?.data?.details || {}), [String(routeId)]: { ...details, cachedAt: Date.now() } };
  const retained = Object.entries(entries)
    .sort(([, left], [, right]) => (right.cachedAt || 0) - (left.cachedAt || 0))
    .slice(0, MAX_CACHED_ROUTE_DETAILS);
  return write(ROUTE_CATALOGUE_KEY, { routes: current?.data?.routes || [], details: Object.fromEntries(retained) });
}
