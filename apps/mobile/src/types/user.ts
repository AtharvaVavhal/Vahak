/**
 * Mirrors the Prisma `UserRole` enum in services/api/src/generated/prisma/enums.ts.
 * Only SENDER, CONDUCTOR, RECIPIENT are self-registerable via POST /auth/register;
 * ADMIN accounts are provisioned separately.
 */
export const UserRole = {
  SENDER: 'SENDER',
  CONDUCTOR: 'CONDUCTOR',
  RECIPIENT: 'RECIPIENT',
  ADMIN: 'ADMIN',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- const + type union is the intended enum-like pattern
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const REGISTERABLE_ROLES = [
  UserRole.SENDER,
  UserRole.CONDUCTOR,
  UserRole.RECIPIENT,
] as const;

export type RegisterableRole = (typeof REGISTERABLE_ROLES)[number];

/** Shape returned by GET /auth/me and embedded in the auth response's `user` field. */
export interface User {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
}
