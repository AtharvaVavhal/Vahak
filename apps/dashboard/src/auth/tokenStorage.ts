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

/**
 * One-shot flag so the login page can explain *why* the user landed there when a session
 * expired mid-use (a 401 outside login/register), rather than silently dropping them back
 * to a blank login form. sessionStorage (not localStorage) so it doesn't leak into a later,
 * unrelated session in the same browser.
 */
const SESSION_EXPIRED_KEY = 'vahak.dashboard.sessionExpired';

export function markSessionExpired(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(SESSION_EXPIRED_KEY, '1');
}

export function consumeSessionExpiredFlag(): boolean {
  if (typeof window === 'undefined') return false;
  const flagged = window.sessionStorage.getItem(SESSION_EXPIRED_KEY) === '1';
  if (flagged) window.sessionStorage.removeItem(SESSION_EXPIRED_KEY);
  return flagged;
}
