import axios from "axios";
import { getToken, clearSession } from "@/utils/storage";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Attach the Bearer token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401 (expired / invalid token) and normalize error messages.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    const message =
      error.response?.data?.message || error.message || "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);
