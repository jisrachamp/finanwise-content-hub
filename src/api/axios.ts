import axios from "axios";
import { API_BASE_URL } from "@/lib/env";
import { loadSession } from "@/auth/auth.storage";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const session = loadSession();
  console.log("API REQUEST URL TOKEEEN: ");
  console.log(session);
  if (session?.accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});
