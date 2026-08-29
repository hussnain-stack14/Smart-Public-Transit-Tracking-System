'use client';

// src/lib/AuthContext.js
// Provides session state (user, loading) and auth actions (login, register, logout)
// to the entire app via React Context. Wrap the app in <AuthProvider> in layout.js.

import { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true until initial session check completes

  // On first mount: if a token exists, restore the session from the server.
  // This keeps the user logged in across page refreshes.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api
        .get("/auth/profile")
        .then((data) => setUser(data))
        .catch(() => localStorage.removeItem("token")) // token expired or invalid
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // login — calls POST /auth/login, persists token, updates user state
  const login = async (email, password) => {
    const data = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    setUser(data);
    return data;
  };

  // register — calls POST /auth/register, same token/user handling as login
  const register = async (name, email, password, phone, role) => {
    const body = { name, email, password, role: role || "commuter" };
    if (phone) body.phone = phone; // phone is optional
    const data = await api.post("/auth/register", body);
    localStorage.setItem("token", data.token);
    setUser(data);
    return data;
  };

  // logout — wipes token and clears user state; caller should redirect to /login
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
