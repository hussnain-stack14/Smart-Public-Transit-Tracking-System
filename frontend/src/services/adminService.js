import api from "../lib/api/axios";
import { API_PATHS } from "../config/api";

export const adminService = {
  summary: () => api.get(API_PATHS.admin).then(({ data }) => data),
};
