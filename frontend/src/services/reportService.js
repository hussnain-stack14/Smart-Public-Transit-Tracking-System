import api from "../lib/api/axios";
import { API_PATHS } from "../config/api";

export const reportService = {
  list: (params) => api.get(API_PATHS.reports, { params }).then(({ data }) => data),
  create: (payload) => api.post(API_PATHS.reports, payload).then(({ data }) => data),
};
