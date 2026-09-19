import api from "../lib/api/axios";
import { API_PATHS } from "../config/api";

export const busService = {
  list: (params) => api.get(API_PATHS.buses, { params }).then(({ data }) => data),
  get: (id) => api.get(`${API_PATHS.buses}/${id}`).then(({ data }) => data),
  getEta: (id) => api.get(`${API_PATHS.buses}/${id}/eta`).then(({ data }) => data),
  create: (payload) => api.post(API_PATHS.buses, payload).then(({ data }) => data),
  update: (id, payload, config) => api.put(`${API_PATHS.buses}/${id}`, payload, config).then(({ data }) => data),
  delete: (id) => api.delete(`${API_PATHS.buses}/${id}`).then(({ data }) => data),
  updateLocation: (id, payload, config) => api.patch(`${API_PATHS.buses}/${id}/location`, payload, config).then(({ data }) => data),
  startReturnTrip: (config) => api.post(`${API_PATHS.buses}/assigned/return-trip`, undefined, config).then(({ data }) => data),
  updateSeats: (id, availableSeats) => api.patch(`${API_PATHS.buses}/${id}/seats`, { availableSeats }).then(({ data }) => data),
};
