import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import type { ApiError } from '@gowander/shared-types';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const TOKEN_KEY = 'gowander_access_token';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request interceptor: attach JWT ─────────────────────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor: normalize errors ───────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      SecureStore.deleteItemAsync(TOKEN_KEY);
    }
    const message =
      error.response?.data?.detail ??
      error.message ??
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  },
);

// ─── Token helpers ────────────────────────────────────────────────────────
export const tokenStorage = {
  save: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  get: () => SecureStore.getItemAsync(TOKEN_KEY),
  remove: () => SecureStore.deleteItemAsync(TOKEN_KEY),
};

/** Backend-relative paths (e.g. "/static/avatars/x.jpg") → absolute URL. */
export function toAbsoluteUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return path.startsWith('/') ? `${BASE_URL}${path}` : path;
}
