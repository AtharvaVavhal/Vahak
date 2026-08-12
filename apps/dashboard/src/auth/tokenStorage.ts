/**
 * Persists the JWT issued by POST /auth/login.
 *
 * The backend returns the token in the JSON response body, not as an httpOnly cookie, so
 * there's no server-managed session for this dashboard to lean on — the token has to be
 * held client-side. localStorage is used so a page reload can restore the session (the
 * explicit requirement); this is a known XSS-exposure tradeoff relative to an httpOnly
 * cookie, appropriate for this hackathon prototype given the backend doesn't issue one.
 * Guarded for SSR since `window`/`localStorage` don't exist during server rendering.
 */
const ACCESS_TOKEN_KEY = 'vahak.dashboard.accessToken';

export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setStoredAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearStoredAccessToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}
