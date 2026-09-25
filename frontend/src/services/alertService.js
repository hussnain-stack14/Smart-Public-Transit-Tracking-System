import api from "../lib/api/axios";
import { API_PATHS } from "../config/api";

// Alerts remain fresh on later reads, but simultaneous consumers share one
// in-flight request instead of calling the same route endpoint twice.
const alertRequests = new Map();

function listByRoute(routeId) {
  const key = String(routeId);
  if (alertRequests.has(key)) return alertRequests.get(key);
  const request = api.get(`${API_PATHS.alerts}/route/${routeId}`).then(({ data }) => data).finally(() => alertRequests.delete(key));
  alertRequests.set(key, request);
  return request;
}

export const alertService = {
  listByRoute,
  create: (payload) => api.post(API_PATHS.alerts, payload).then(({ data }) => data),
  delete: (id) => api.delete(`${API_PATHS.alerts}/${id}`).then(({ data }) => data),
};
