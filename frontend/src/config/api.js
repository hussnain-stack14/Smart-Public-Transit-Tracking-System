const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
const configuredSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || configuredApiUrl;

export const API_URL = configuredApiUrl.includes("YOUR_BACKEND_PORT") ? "" : configuredApiUrl;
export const SOCKET_URL = configuredSocketUrl.includes("YOUR_BACKEND_PORT") ? "" : configuredSocketUrl;

export const API_PATHS = {
  auth: "/api/auth",
  routes: "/api/routes",
  stops: "/api/stops",
  buses: "/api/buses",
  bookings: "/api/bookings",
  reports: "/api/reports",
  alerts: "/api/route-alerts",
  safety: "/api/safety",
  admin: "/api/admin",
};
