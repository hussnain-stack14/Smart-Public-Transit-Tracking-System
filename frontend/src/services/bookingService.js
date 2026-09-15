import api from "../lib/api/axios";
import { API_PATHS } from "../config/api";

export const bookingService = {
  list: (params) => api.get(API_PATHS.bookings, { params }).then(({ data }) => data),
  create: (payload) => api.post(API_PATHS.bookings, payload).then(({ data }) => data),
  get: (id) => api.get(`${API_PATHS.bookings}/${id}`).then(({ data }) => data),
};
