import api from "../lib/api/axios";
import { API_PATHS } from "../config/api";

export const bookingService = {
  getMyBookings: () => api.get(`${API_PATHS.bookings}/me`).then(({ data }) => data),
  create: (payload) => api.post(API_PATHS.bookings, payload).then(({ data }) => data),
  cancel: (id) => api.patch(`${API_PATHS.bookings}/${id}/cancel`).then(({ data }) => data),
};
