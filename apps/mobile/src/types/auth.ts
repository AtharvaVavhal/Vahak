import type { RegisterableRole, User } from './user';

/** Body for POST /auth/login (services/api/src/auth/dto/login.dto.ts). */
export interface LoginRequest {
  /** Exactly 10 digits. */
  phone: string;
  /** Minimum 8 characters. */
  password: string;
}

/** Body for POST /auth/register (services/api/src/auth/dto/register.dto.ts). */
export interface RegisterRequest {
  name: string;
  /** Exactly 10 digits. */
  phone: string;
  email?: string;
  /** Minimum 8 characters. */
  password: string;
  /** Defaults to SENDER on the backend when omitted. */
  role?: RegisterableRole;
}

/** Response shape shared by POST /auth/login and POST /auth/register. */
export interface AuthResponse {
  accessToken: string;
  user: User;
}
