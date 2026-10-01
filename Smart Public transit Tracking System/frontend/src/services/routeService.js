import api from "../lib/api/axios";
import { API_PATHS } from "../config/api";

let routesCache = null;
let routesRequest = null;

function clearRoutesCache() {
  routesCache = null;
  routesRequest = null;
}

function listRoutes(params) {
  // Filtered route requests stay fresh. The unfiltered catalogue is shared by
  // Home, Maps, Booking and admin views during the current browser session.
  if (params && Object.keys(params).length) return api.get(API_PATHS.routes, { params }).then(({ data }) => data);
  if (routesCache) return Promise.resolve(routesCache);
  if (routesRequest) return routesRequest;
  routesRequest = api.get(API_PATHS.routes).then(({ data }) => {
    routesCache = data;
    return data;
  }).finally(() => { routesRequest = null; });
  return routesRequest;
}

export const routeService = {
  list: listRoutes,
  get: (id) => api.get(`${API_PATHS.routes}/${id}`).then(({ data }) => data),
  create: (payload) => api.post(API_PATHS.routes, payload).then(({ data }) => { clearRoutesCache(); return data; }),
  update: (id, payload) => api.put(`${API_PATHS.routes}/${id}`, payload).then(({ data }) => { clearRoutesCache(); return data; }),
  delete: (id) => api.delete(`${API_PATHS.routes}/${id}`).then(({ data }) => { clearRoutesCache(); return data; }),
  invalidateCache: clearRoutesCache,
};
