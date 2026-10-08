const DB_NAME = "smart-safar-live-map";
const STORE_NAME = "snapshots";
const MAP_STATE_KEY = "map-state";
const TRANSIT_SNAPSHOT_KEY = "transit-snapshot";

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
