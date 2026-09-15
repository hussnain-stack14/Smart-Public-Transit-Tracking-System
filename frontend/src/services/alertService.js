import api from "../lib/api/axios";
import { API_PATHS } from "../config/api";

export const alertService = {
  list: (params) => api.get(API_PATHS.alerts, { params }).then(({ data }) => data),
  listByRoute: (routeId) => api.get(`${API_PATHS.alerts}/route/${routeId}`).then(({ data }) => data),
};
