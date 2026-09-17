import api from "../lib/api/axios";
import { API_PATHS } from "../config/api";

export const stopService = {
  listByRoute: (routeId, config) => api.get(`${API_PATHS.stops}/route/${routeId}`, config).then(({ data }) => data),
  get: (id) => api.get(`${API_PATHS.stops}/${id}`).then(({ data }) => data),
  create: (payload) => api.post(API_PATHS.stops, payload).then(({ data }) => data),
  update: (id, payload) => api.put(`${API_PATHS.stops}/${id}`, payload).then(({ data }) => data),
  delete: (id) => api.delete(`${API_PATHS.stops}/${id}`).then(({ data }) => data),
};