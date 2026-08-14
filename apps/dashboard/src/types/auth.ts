import type { User } from './user';

/** Body for POST /auth/login (services/api/src/auth/dto/login.dto.ts). */
export interface LoginRequest {
  /** Exactly 10 digits. */
  phone: string;
  /** Minimum 8 characters. */
  password: string;
}

/** Response shape of POST /auth/login. */
export interface AuthResponse {
  accessToken: string;
  user: User;
}
