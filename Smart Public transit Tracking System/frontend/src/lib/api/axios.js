import axios from "axios";
import { API_URL, API_PATHS } from "../../config/api";
import { getAccessToken, clearAccessToken } from "../auth/token";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  const bookingRequest = config.url === API_PATHS.bookings || config.url?.startsWith(API_PATHS.bookings + "/");
  const mutation = ["post", "patch", "put", "delete"].includes(config.method?.toLowerCase());
  if (!token && bookingRequest && mutation) {
    return Promise.reject(new axios.AxiosError("Please sign in to book a ticket.", "ERR_AUTH_REQUIRED", config));
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) clearAccessToken();
    return Promise.reject(error);
  },
);

export default api;
