/**
 * Runtime configuration, sourced from EXPO_PUBLIC_* environment variables.
 * See `.env.example` for the variables a developer needs to set locally.
 * Expo inlines `EXPO_PUBLIC_*` vars at build time — never put secrets here.
 */

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Copy .env.example to .env and set it.`,
    );
  }
  return value;
}

export const API_BASE_URL = requireEnv(
  'EXPO_PUBLIC_API_URL',
  process.env.EXPO_PUBLIC_API_URL,
);

export const API_TIMEOUT_MS = 15000;
