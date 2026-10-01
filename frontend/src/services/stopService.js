import api from "../lib/api/axios";
import { API_PATHS } from "../config/api";

const stopsCache = new Map();
const stopsRequests = new Map();

function clearStopsCache(routeId) {
  if (routeId) {
    stopsCache.delete(String(routeId));
    stopsRequests.delete(String(routeId));
    return;
  }
  stopsCache.clear();
  stopsRequests.clear();
}

function listByRoute(routeId, config) {
  // Abortable requests remain isolated because their caller owns cancellation.
  if (config?.signal) return api.get(`${API_PATHS.stops}/route/${routeId}`, config).then(({ data }) => data);
  const key = String(routeId);
  if (stopsCache.has(key)) return Promise.resolve(stopsCache.get(key));
  if (stopsRequests.has(key)) return stopsRequests.get(key);
  const request = api.get(`${API_PATHS.stops}/route/${routeId}`, config).then(({ data }) => {
    stopsCache.set(key, data);
    return data;
  }).finally(() => stopsRequests.delete(key));
  stopsRequests.set(key, request);
  return request;
}

export const stopService = {
  listByRoute,
  get: (id) => api.get(`${API_PATHS.stops}/${id}`).then(({ data }) => data),
  create: (payload) => api.post(API_PATHS.stops, payload).then(({ data }) => { clearStopsCache(payload.route?._id || payload.route); return data; }),
  update: (id, payload) => api.put(`${API_PATHS.stops}/${id}`, payload).then(({ data }) => { clearStopsCache(); return data; }),
  delete: (id, assignment = {}) => api.delete(`${API_PATHS.stops}/${id}`, { params: assignment }).then(({ data }) => { clearStopsCache(); return data; }),
  invalidateCache: clearStopsCache,
};
