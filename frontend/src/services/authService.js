import api from "../lib/api/axios";
import { API_PATHS } from "../config/api";
import { setAccessToken } from "../lib/auth/token";

export async function login(credentials) {
  const { data } = await api.post(`${API_PATHS.auth}/login`, credentials);
  if (data.token || data.accessToken) setAccessToken(data.token || data.accessToken);
  return data;
}

export async function loginDriver(credentials) {
  return login({ ...credentials, role: "driver" });
}

export async function loginAdmin(credentials) {
  return login({ ...credentials, role: "admin" });
}
