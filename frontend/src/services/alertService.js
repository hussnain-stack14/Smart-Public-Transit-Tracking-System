import api from "../lib/api/axios";
import { API_PATHS } from "../config/api";

export const alertService = {
  listByRoute: (routeId) => api.get(`${API_PATHS.alerts}/route/${routeId}`).then(({ data }) => data),
  create: (payload) => api.post(API_PATHS.alerts, payload).then(({ data }) => data),
  delete: (id) => api.delete(`${API_PATHS.alerts}/${id}`).then(({ data }) => data),
};