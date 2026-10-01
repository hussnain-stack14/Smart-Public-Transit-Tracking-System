const NOMINATIM_URL = process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org/search";
const FAISALABAD_VIEWBOX = "72.75,31.65,73.35,31.20";
const REQUEST_INTERVAL_MS = 1100;
const CACHE_TTL_MS = 60 * 60 * 1000;
const resultCache = new Map();
const OTHER_CITY_PATTERN = /\b(karachi|lahore|islamabad|rawalpindi|multan|gujranwala|peshawar|quetta|sialkot|hyderabad)\b/i;
const QUERY_ALIASES = new Map([
  ["gts", ["GTS Bus Stand", "General Bus Stand"]],
  ["makuana", ["Makkuana"]],
]);

let requestQueue = Promise.resolve();
let lastRequestAt = 0;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function addLocalSearchContext(query, originalQuery) {
  const normalized = query.toLowerCase();
  if (originalQuery.includes(",") || OTHER_CITY_PATTERN.test(originalQuery)) return query;
  const parts = [query];
  if (!normalized.includes("faisalabad")) parts.push("Faisalabad");
  if (!normalized.includes("punjab")) parts.push("Punjab");
  if (!normalized.includes("pakistan")) parts.push("Pakistan");
  return parts.join(", ");
}

function buildSearchQueries(query) {
  const candidates = [query];
  const relaxed = query.replace(/\b(chowk|city)\b/gi, " ").replace(/\s+/g, " ").trim();
  if (relaxed && relaxed.toLowerCase() !== query.toLowerCase()) candidates.push(relaxed);
  else if (!/\b(road|street|bus stand|railway station)\b/i.test(query)) candidates.push(`${query} Road`);

  const compoundAbad = query.replace(/([a-z])abad\b/i, "$1 Abad");
  if (compoundAbad.toLowerCase() !== query.toLowerCase()) candidates.push(compoundAbad);
  for (const alias of QUERY_ALIASES.get(query.toLowerCase()) || []) candidates.push(alias);

  return [...new Map(candidates.map((candidate) => [candidate.toLowerCase(), candidate])).values()].slice(0, 3);
}

function fetchFromNominatim(query, originalQuery) {
  const parameters = new URLSearchParams({
    q: addLocalSearchContext(query, originalQuery),
    format: "jsonv2",
    addressdetails: "1",
    limit: "8",
    countrycodes: "pk",
    viewbox: FAISALABAD_VIEWBOX,
    bounded: "0",
    "accept-language": "en",
  });

  const request = requestQueue.then(async () => {
    const delay = Math.max(0, REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt));
    if (delay) await wait(delay);
    lastRequestAt = Date.now();
    return fetch(`${NOMINATIM_URL}?${parameters}`, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent": "SmartPublicTransitTrackingSystem/1.0",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
  });
  requestQueue = request.catch(() => {});
  return request;
}

export async function GET(request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().replace(/\s+/g, " ") || "";
  if (!query) return Response.json({ message: "A location query is required." }, { status: 400 });
  if (query.length > 160) return Response.json({ message: "The location query is too long." }, { status: 400 });

  const cacheKey = query.toLocaleLowerCase("en");
  const cached = resultCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) return Response.json(cached.results);

  try {
    let results = [];
    for (const candidate of buildSearchQueries(query)) {
      const response = await fetchFromNominatim(candidate, query);
      if (!response.ok) {
        return Response.json({ message: "The location provider is temporarily unavailable." }, { status: 502 });
      }

      results = await response.json();
      if (!Array.isArray(results)) {
        return Response.json({ message: "The location provider returned an invalid response." }, { status: 502 });
      }
      if (results.length) break;
    }

    resultCache.set(cacheKey, { createdAt: Date.now(), results });
    if (resultCache.size > 100) resultCache.delete(resultCache.keys().next().value);
    return Response.json(results);
  } catch {
    return Response.json({ message: "The location provider could not be reached." }, { status: 502 });
  }
}
