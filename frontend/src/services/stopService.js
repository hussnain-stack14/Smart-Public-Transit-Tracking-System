import api from "../lib/api/axios";
import { API_PATHS } from "../config/api";

export const stopService = {
  list: (params) => api.get(API_PATHS.stops, { params }).then(({ data }) => data),
  listByRoute: (routeId) => api.get(`${API_PATHS.stops}/route/${routeId}`).then(({ data }) => data),
  get: (id) => api.get(`${API_PATHS.stops}/${id}`).then(({ data }) => data),
};
