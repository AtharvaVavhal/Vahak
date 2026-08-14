/**
 * Client-side mirrors of the backend's class-validator rules, read from
 * services/api/src/**\/dto/*.ts on origin/feat/backend. UX pre-checks only — the backend
 * remains the source of truth and is validated again on submit; its error message is what
 * gets displayed on failure.
 */

const PHONE_REGEX = /^[0-9]{10}$/;
// class-validator's @IsUUID() (no version arg) accepts any RFC 4122 UUID version.
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const MIN_PASSWORD_LENGTH = 8;

export function validatePhone(phone: string): string | null {
  if (!phone) return 'Phone number is required';
  if (!PHONE_REGEX.test(phone)) return 'Phone must be exactly 10 digits';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

/** Mirrors @IsString() @IsNotEmpty() — used for Route name/origin/destination, Halt name, Bus registration. */
export function validateRequiredText(label: string, value: string): string | null {
  if (!value.trim()) return `${label} is required`;
  return null;
}

/** Mirrors CreateHaltDto's sequence: @Type(() => Number) @IsInt() @Min(1). */
export function validateSequence(value: string): string | null {
  if (!value) return 'Sequence is required';
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return 'Sequence must be a whole number';
  if (parsed < 1) return 'Sequence must be at least 1';
  return null;
}

/** Mirrors Halt's optional latitude/longitude: @IsOptional() @Type(() => Number) @IsNumber(). */
export function validateOptionalNumber(label: string, value: string): string | null {
  if (!value) return null;
  if (Number.isNaN(Number(value))) return `${label} must be a number`;
  return null;
}

/** Mirrors @IsUUID() used for the consignment-lookup ID field. */
export function validateRequiredUuid(label: string, value: string): string | null {
  if (!value) return `${label} is required`;
  if (!UUID_REGEX.test(value.trim())) return `${label} must be a valid UUID`;
  return null;
}
