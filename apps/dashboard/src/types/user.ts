/**
 * Mirrors the Prisma `UserRole` enum (database/prisma/schema.prisma on origin/feat/backend).
 * Only SENDER, CONDUCTOR, RECIPIENT are self-registerable via POST /auth/register;
 * ADMIN accounts are provisioned separately (no registration endpoint accepts it — verified
 * live: POST /auth/register with role "ADMIN" returns 400).
 */
export const UserRole = {
  SENDER: 'SENDER',
  CONDUCTOR: 'CONDUCTOR',
  RECIPIENT: 'RECIPIENT',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Shape returned by GET /auth/me and embedded in the login/register response's `user` field. */
export interface User {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
}
