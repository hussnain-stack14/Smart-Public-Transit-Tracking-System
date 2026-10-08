import api from "../lib/api/axios";
import { API_PATHS } from "../config/api";
import { setAccessToken } from "../lib/auth/token";
import { readPrivateSnapshot, savePrivateSnapshot } from "../lib/live-map/liveMapStorage";

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

function storeSession(data) {
  if (data.token || data.accessToken) {
    resetProfileCache();
    setAccessToken(data.token || data.accessToken);
  }
  return data;
}

export function getRoleHome(role, fallback = "/") {
  if (role === "admin") return "/admin/dashboard";
  if (role === "driver") return "/driver/dashboard";
  return fallback.startsWith("/admin") || fallback.startsWith("/driver") ? "/" : fallback;
}

export async function login(credentials) {
  const { data } = await api.post(`${API_PATHS.auth}/login`, credentials);
  return storeSession(data);
}

export async function googleLogin(credential) {
  const { data } = await api.post(`${API_PATHS.auth}/google`, { credential });
  return storeSession(data);
}

export async function register(credentials) {
  const { data } = await api.post(`${API_PATHS.auth}/register`, credentials);
  return storeSession(data);
}

export async function getProfile({ force = false } = {}) {
  const token = typeof window === "undefined" ? null : window.localStorage.getItem("smart-transit-access-token");
  if (!force && cachedProfile && cachedProfileToken === token) return cachedProfile;
  if (!force && profileRequest && profileRequestToken === token) return profileRequest;
  profileRequestToken = token;
  profileRequest = api.get(`${API_PATHS.auth}/profile`).then(({ data }) => {
    if (profileRequestToken === token) { cachedProfile = data; cachedProfileToken = token; }
    if (token) savePrivateSnapshot(token, "profile", data);
    return data;
  }).finally(() => { if (profileRequestToken === token) profileRequest = null; });
  return profileRequest;
}

export async function updateProfile(values) {
  const { data } = await api.patch(`${API_PATHS.auth}/profile`, values);
  cachedProfile = data;
  cachedProfileToken = typeof window === "undefined" ? null : window.localStorage.getItem("smart-transit-access-token");
  profileRequest = null;
  profileRequestToken = null;
  if (cachedProfileToken) savePrivateSnapshot(cachedProfileToken, "profile", data);
  return data;
}

export async function getCachedProfile(token) {
  const cached = await readPrivateSnapshot(token, "profile");
  return cached?.data || null;
}

export async function changePassword(values) {
  const { data } = await api.patch(`${API_PATHS.auth}/password`, values);
  return data;
}

export function clearProfileCache() { resetProfileCache(); }
