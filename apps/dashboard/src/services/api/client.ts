import axios, { type InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL, API_TIMEOUT_MS } from '../../constants/config';
import { emitSessionExpired } from '../../auth/sessionEvents';
import { getStoredAccessToken } from '../../auth/tokenStorage';
import { ApiError } from '../../utils/ApiError';
import type { ApiErrorBody } from '../../types';

/** Endpoints where a 401 means "bad credentials", not "your session expired". */
const UNAUTHENTICATED_AUTH_PATHS = ['/auth/login', '/auth/register'];

/**
 * Shared HTTP client for the backend (services/api). The backend currently
 * has no global route prefix (see main.ts), so paths are bare, e.g. '/auth/login'.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const isAuthEndpoint = UNAUTHENTICATED_AUTH_PATHS.some((path) =>
          error.config?.url?.includes(path),
        );
        if (error.response.status === 401 && !isAuthEndpoint) {
          emitSessionExpired();
        }
        const body = error.response.data as Partial<ApiErrorBody> | undefined;
        throw ApiError.fromResponseBody(body ?? {}, error.message);
      }
      throw new ApiError(
        error.code === 'ECONNABORTED'
          ? 'Request timed out. Check your connection and API URL.'
          : 'Could not reach the server. Check your connection and API URL.',
      );
    }
    throw error;
  },
);
