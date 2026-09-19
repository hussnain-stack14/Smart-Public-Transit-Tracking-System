const SEARCH_URL = "/api/geocoding/search";
const REQUEST_INTERVAL_MS = 1100;
const resultCache = new Map();

let requestQueue = Promise.resolve();
let lastRequestAt = 0;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function regionalScore(result) {
  const address = result.address || {};
  const searchable = [
    result.display_name,
    address.city,
    address.town,
    address.village,
    address.county,
    address.state_district,
    address.state,
  ].filter(Boolean).join(" ").toLowerCase();

  let score = 0;
  if (searchable.includes("faisalabad")) score += 4;
  if (searchable.includes("punjab")) score += 2;
  if (searchable.includes("pakistan")) score += 1;
  return score;
}

function normalizeResult(result) {
  const latitude = Number(result.lat);
  const longitude = Number(result.lon);
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180) return null;

  const parts = String(result.display_name || "").split(",").map((part) => part.trim()).filter(Boolean);
  const name = result.name || parts[0] || "Location result";
  const address = parts[0] === name ? parts.slice(1).join(", ") : parts.join(", ");
  return {
    id: result.osm_type && result.osm_id ? `${result.osm_type}-${result.osm_id}` : String(result.place_id),
    name,
    address,
    latitude,
    longitude,
  };
}

async function requestLocations(query, signal) {
  const delay = Math.max(0, REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt));
  if (delay) await wait(delay);
  if (signal?.aborted) throw new DOMException("The search was cancelled.", "AbortError");
  lastRequestAt = Date.now();

  const parameters = new URLSearchParams({ q: query });
  const response = await fetch(`${SEARCH_URL}?${parameters}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new Error(`Location search failed with status ${response.status}.`);

  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("Location search returned an invalid response.");
  return data
    .map((result, index) => ({ result, index, score: regionalScore(result) }))
    .sort((first, second) => second.score - first.score || first.index - second.index)
    .map(({ result }) => normalizeResult(result))
    .filter(Boolean);
}

export const locationSearchService = {
  search(query, { signal } = {}) {
    const normalizedQuery = query.trim().replace(/\s+/g, " ");
    if (!normalizedQuery) return Promise.resolve([]);

    const cacheKey = normalizedQuery.toLocaleLowerCase("en");
    if (resultCache.has(cacheKey)) return Promise.resolve(resultCache.get(cacheKey));

    const request = requestQueue.then(() => requestLocations(normalizedQuery, signal));
    requestQueue = request.catch(() => {});
    return request.then((results) => {
      resultCache.set(cacheKey, results);
      return results;
    });
  },
};
