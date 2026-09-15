import api from "../lib/api/axios";
import { API_PATHS } from "../config/api";

export const busService = {
  list: (params) => api.get(API_PATHS.buses, { params }).then(({ data }) => data),
  get: (id) => api.get(`${API_PATHS.buses}/${id}`).then(({ data }) => data),
  getEta: (id) => api.get(`${API_PATHS.buses}/${id}/eta`).then(({ data }) => data),
};
