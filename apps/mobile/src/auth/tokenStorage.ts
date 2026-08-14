import * as SecureStore from 'expo-secure-store';

/**
 * Persists the JWT issued by POST /auth/login and /auth/register.
 * expo-secure-store backs onto Keychain on iOS / Keystore on Android, so the
 * token never lands in plaintext storage.
 */
const ACCESS_TOKEN_KEY = 'vahak.accessToken';

export async function getStoredAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function setStoredAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function clearStoredAccessToken(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}
