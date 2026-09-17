import api from "../lib/api/axios";
import { API_PATHS } from "../config/api";
import { setAccessToken } from "../lib/auth/token";

export function getRoleHome(role, fallback = "/") {
  if (role === "admin") return "/admin/dashboard";
  if (role === "driver") return "/driver/dashboard";
  return fallback.startsWith("/admin") || fallback.startsWith("/driver") ? "/" : fallback;
}

export async function login(credentials) {
  const { data } = await api.post(`${API_PATHS.auth}/login`, credentials);
  if (data.token || data.accessToken) setAccessToken(data.token || data.accessToken);
  return data;
}

export async function register(credentials) {
  const { data } = await api.post(`${API_PATHS.auth}/register`, credentials);
  if (data.token || data.accessToken) setAccessToken(data.token || data.accessToken);
  return data;
}

export async function getProfile() {
  const { data } = await api.get(`${API_PATHS.auth}/profile`);
  return data;
}