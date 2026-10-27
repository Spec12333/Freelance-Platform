// Single axios instance for the whole app: base URL, auth header, session handling.
import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/store/auth";
import type { ApiErrorBody } from "@/types/api";

if (!import.meta.env.VITE_API_URL) {
  console.error("VITE_API_URL is not set, copy .env.example to .env");
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // Generous on purpose: a sleeping free Render instance takes 30-50 s to wake up.
  timeout: 60000,
});

// Attach the token to every request. Read on each call, not once at import,
// so a fresh login is picked up immediately.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 on these means "wrong credentials", not "session expired",
// so the form must get the error instead of a logout.
const AUTH_FORMS = ["/auth/login", "/auth/register"];

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const { token, logout } = useAuthStore.getState();

    // Token expired or invalid. ProtectedRoute reacts to the empty store
    // and redirects to /login, so no manual navigation here.
    if (status === 401 && token && !AUTH_FORMS.includes(url)) {
      logout();
    }

    // Blocked by an admin while signed in: the old token keeps returning 403.
    if (status === 403 && error.response?.data?.message === "Your account has been blocked") {
      logout();
    }

    // Always pass the error on, so forms and queries can show it.
    return Promise.reject(error);
  },
);

// Turns any error into a line of text for the UI.
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return "Server is unavailable, please try again later";
    return error.response.data?.message ?? "Something went wrong";
  }
  return "Something went wrong";
}

export default api;