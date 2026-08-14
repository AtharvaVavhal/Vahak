/**
 * Client-side mirrors of the backend's class-validator rules
 * (services/api/src/auth/dto/login.dto.ts, register.dto.ts, read from compiled dist/).
 * These are UX pre-checks only — the backend remains the source of truth and
 * is validated again on submit; its error message is what gets displayed on failure.
 */

const PHONE_REGEX = /^[0-9]{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// class-validator's @IsUUID() (no version arg) accepts any RFC 4122 UUID version.
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Mirrors ConsignmentsService.verifyHandover's own regex check (not a DTO decorator — the
// controller's @Body() type is a plain `{ pin: string }`, validated by hand in the service).
const HANDOVER_PIN_REGEX = /^\d{6}$/;

export const MIN_PASSWORD_LENGTH = 8;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;

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

export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < NAME_MIN_LENGTH || trimmed.length > NAME_MAX_LENGTH) {
    return `Name must be between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters`;
  }
  return null;
}

/** Email is optional on the backend — only validated when non-empty. */
export function validateEmail(email: string): string | null {
  if (!email) return null;
  if (!EMAIL_REGEX.test(email)) return 'Enter a valid email address';
  return null;
}

/** Mirrors @IsUUID() on CreateConsignmentDto's recipientId/routeId/pickupHaltId/dropoffHaltId. */
export function validateRequiredUuid(label: string, value: string): string | null {
  if (!value) return `${label} is required`;
  if (!UUID_REGEX.test(value.trim())) return `${label} must be a valid UUID`;
  return null;
}

/** Mirrors @IsOptional() @IsUUID() on CreateConsignmentDto's busId. */
export function validateOptionalUuid(label: string, value: string): string | null {
  if (!value) return null;
  if (!UUID_REGEX.test(value.trim())) return `${label} must be a valid UUID`;
  return null;
}

/** Mirrors @Type(() => Number) @IsNumber() @Min(0) on CreateConsignmentDto's fare. */
export function validateFare(value: string): string | null {
  if (!value) return 'Fare is required';
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 'Fare must be a number';
  if (parsed < 0) return 'Fare must not be less than 0';
  return null;
}

/** Mirrors the handover PIN's exact backend rule: exactly 6 digits. */
export function validateHandoverPin(pin: string): string | null {
  if (!pin) return 'PIN is required';
  if (!HANDOVER_PIN_REGEX.test(pin)) return 'PIN must be exactly 6 digits';
  return null;
}

/**
 * Mirrors @IsString() @IsNotEmpty() — used for Route name/origin/destination, Halt name,
 * and Bus registration. No length bound is specified server-side, so none is added here.
 */
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
