import axios from "axios";

export const API_URL = "http://localhost:1337/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Adjunta JWT desde sessionStorage si existe
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("access_token") || sessionStorage.getItem("jwt");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
