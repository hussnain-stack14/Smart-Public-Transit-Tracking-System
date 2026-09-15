import api from "../lib/api/axios";
import { API_PATHS } from "../config/api";

export const routeService = {
  list: (params) => api.get(API_PATHS.routes, { params }).then(({ data }) => data),
  get: (id) => api.get(`${API_PATHS.routes}/${id}`).then(({ data }) => data),
};
