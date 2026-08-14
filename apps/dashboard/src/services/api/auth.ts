import { apiClient } from './client';
import type { AuthResponse, LoginRequest, User } from '../../types';

/**
 * Wraps services/api's AuthController (services/api/src/auth/auth.controller.ts on
 * origin/feat/backend). No global route prefix.
 *   POST /auth/login
 *   GET  /auth/me   (Bearer token required)
 *
 * There is no admin registration endpoint — POST /auth/register only accepts
 * SENDER/CONDUCTOR/RECIPIENT (verified live: role "ADMIN" -> 400), so it is not wired
 * here. Admin accounts are provisioned out of band.
 */
export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me');
  return data;
}
