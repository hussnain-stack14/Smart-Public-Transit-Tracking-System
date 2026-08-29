// src/lib/api.js
// Thin fetch wrapper that auto-attaches JWT, handles JSON and errors uniformly.
// All methods throw an Error whose .message is the backend's own `message` field.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function apiFetch(endpoint, options = {}) {
  // Guard: localStorage is only available in browser contexts
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export const api = {
  get:    (endpoint)        => apiFetch(endpoint),
  post:   (endpoint, body)  => apiFetch(endpoint, { method: "POST",   body: JSON.stringify(body) }),
  put:    (endpoint, body)  => apiFetch(endpoint, { method: "PUT",    body: JSON.stringify(body) }),
  patch:  (endpoint, body)  => apiFetch(endpoint, { method: "PATCH",  body: JSON.stringify(body) }),
  delete: (endpoint)        => apiFetch(endpoint, { method: "DELETE" }),
};
