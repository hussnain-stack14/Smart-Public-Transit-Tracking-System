import api from "../lib/api/axios";
import { API_PATHS } from "../config/api";

export const routeService = {
  list: (params) => api.get(API_PATHS.routes, { params }).then(({ data }) => data),
  get: (id) => api.get(`${API_PATHS.routes}/${id}`).then(({ data }) => data),
  create: (payload) => api.post(API_PATHS.routes, payload).then(({ data }) => data),
  update: (id, payload) => api.put(`${API_PATHS.routes}/${id}`, payload).then(({ data }) => data),
  delete: (id) => api.delete(`${API_PATHS.routes}/${id}`).then(({ data }) => data),
};
