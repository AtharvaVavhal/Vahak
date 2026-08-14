import { apiClient } from './client';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../../types';

/**
 * Wraps services/api's AuthController (services/api/src/auth/auth.controller.ts,
 * read from its compiled dist output since the module has no global route prefix):
 *   POST /auth/register
 *   POST /auth/login
 *   GET  /auth/me   (Bearer token required)
 */
export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me');
  return data;
}
