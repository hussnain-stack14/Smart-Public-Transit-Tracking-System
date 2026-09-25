import api from "../lib/api/axios";
import { API_PATHS } from "../config/api";
import { setAccessToken } from "../lib/auth/token";

let cachedProfile = null;
let cachedProfileToken = null;
let profileRequest = null;
let profileRequestToken = null;

function resetProfileCache() {
  cachedProfile = null;
  cachedProfileToken = null;
  profileRequest = null;
  profileRequestToken = null;
}

export function getRoleHome(role, fallback = "/") {
  if (role === "admin") return "/admin/dashboard";
  if (role === "driver") return "/driver/dashboard";
  return fallback.startsWith("/admin") || fallback.startsWith("/driver") ? "/" : fallback;
}

export async function login(credentials) {
  const { data } = await api.post(`${API_PATHS.auth}/login`, credentials);
  if (data.token || data.accessToken) {
    resetProfileCache();
    setAccessToken(data.token || data.accessToken);
  }
  return data;
}

export async function register(credentials) {
  const { data } = await api.post(`${API_PATHS.auth}/register`, credentials);
  if (data.token || data.accessToken) {
    resetProfileCache();
    setAccessToken(data.token || data.accessToken);
  }
  return data;
}

export async function getProfile({ force = false } = {}) {
  const token = typeof window === "undefined" ? null : window.localStorage.getItem("smart-transit-access-token");
  if (!force && cachedProfile && cachedProfileToken === token) return cachedProfile;
  if (!force && profileRequest && profileRequestToken === token) return profileRequest;

  profileRequestToken = token;
  profileRequest = api.get(`${API_PATHS.auth}/profile`).then(({ data }) => {
    if (profileRequestToken === token) {
      cachedProfile = data;
      cachedProfileToken = token;
    }
    return data;
  }).finally(() => {
    if (profileRequestToken === token) profileRequest = null;
  });
  return profileRequest;
}

export function clearProfileCache() {
  resetProfileCache();
}
