/**
 * Runtime configuration, sourced from NEXT_PUBLIC_* environment variables.
 * See `.env.example` for what a developer needs to set in `.env.local`.
 * Next.js inlines `NEXT_PUBLIC_*` vars into the client bundle at build time — never put
 * secrets here.
 */

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Copy .env.example to .env.local and set it.`,
    );
  }
  return value;
}

export const API_BASE_URL = requireEnv('NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL);

export const API_TIMEOUT_MS = 15000;
