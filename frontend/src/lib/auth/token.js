const TOKEN_KEY = "smart-transit-access-token";
const AUTH_CHANGE_EVENT = "smart-transit-auth-change";

function notifyAuthChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token) {
  if (typeof window !== "undefined" && token) {
    window.localStorage.setItem(TOKEN_KEY, token);
    notifyAuthChange();
  }
}

export function clearAccessToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
    notifyAuthChange();
  }
}

export { AUTH_CHANGE_EVENT };