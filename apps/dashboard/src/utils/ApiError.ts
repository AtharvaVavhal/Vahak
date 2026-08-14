import type { ApiErrorBody } from '../types';

/** Thrown by the API client for any non-2xx response or network failure. */
export class ApiError extends Error {
  readonly statusCode: number | null;
  readonly path: string | null;

  constructor(message: string, statusCode: number | null = null, path: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.path = path;
  }

  static fromResponseBody(body: Partial<ApiErrorBody>, fallbackMessage: string): ApiError {
    return new ApiError(body.message ?? fallbackMessage, body.statusCode ?? null, body.path ?? null);
  }
}
