/**
 * Mirrors services/api's Consignment domain, read from database/prisma/schema.prisma
 * and services/api/src/consignments/{consignments.controller,consignments.service,dto/create-consignment.dto}.ts
 * on origin/feat/backend, and verified against live responses from the running API.
 */

export const ParcelSize = {
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- const + type union is the intended enum-like pattern
export type ParcelSize = (typeof ParcelSize)[keyof typeof ParcelSize];

export const ConsignmentStatus = {
  CREATED: 'CREATED',
  BOOKED: 'BOOKED',
  ACCEPTED: 'ACCEPTED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- const + type union is the intended enum-like pattern
export type ConsignmentStatus = (typeof ConsignmentStatus)[keyof typeof ConsignmentStatus];

/** Minimal user projection used in `include: { select: { id, name, phone, email } }` relations. */
export interface ConsignmentUserSummary {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

/** Route model as returned by Prisma (Decimal-free — no lat/lng on Route itself). */
export interface ConsignmentRouteSummary {
  id: string;
  name: string;
  origin: string;
  destination: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Halt model. latitude/longitude are Prisma `Decimal` columns, which the API
 * serializes to JSON as strings (verified against a live response) — not numbers.
 */
export interface ConsignmentHaltSummary {
  id: string;
  routeId: string;
  name: string;
  sequence: number;
  latitude: string | null;
  longitude: string | null;
}

export interface ConsignmentBusSummary {
  id: string;
  registration: string;
  routeId: string;
  active: boolean;
  createdAt: string;
}

/**
 * Flat shape returned by POST /consignments, POST /consignments/:id/book,
 * and POST /consignments/:id/cancel — none of those include relations.
 * `fare` is a Prisma Decimal, serialized as a string (verified live: "150", not 150).
 */
export interface Consignment {
  id: string;
  trackingCode: string;
  senderId: string;
  recipientId: string;
  conductorId: string | null;
  routeId: string;
  busId: string | null;
  pickupHaltId: string;
  dropoffHaltId: string;
  parcelSize: ParcelSize;
  description: string | null;
  fare: string;
  status: ConsignmentStatus;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by GET /consignments (findMine) — Consignment + relations, no `sender`. */
export interface ConsignmentListItem extends Consignment {
  recipient: ConsignmentUserSummary;
  route: ConsignmentRouteSummary;
  pickupHalt: ConsignmentHaltSummary;
  dropoffHalt: ConsignmentHaltSummary;
  bus: ConsignmentBusSummary | null;
}

/** Shape returned by GET /consignments/:id (findById) — adds `sender`. */
export interface ConsignmentDetail extends ConsignmentListItem {
  sender: ConsignmentUserSummary;
}

/**
 * Body for POST /consignments (services/api/src/consignments/dto/create-consignment.dto.ts).
 * There is no route/halt/bus browsing or recipient-lookup endpoint reachable by a SENDER
 * (see routes/halts/buses controllers — @Roles('ADMIN', 'CONDUCTOR') only), so these IDs
 * currently have to be supplied directly.
 */
export interface CreateConsignmentRequest {
  recipientId: string;
  routeId: string;
  pickupHaltId: string;
  dropoffHaltId: string;
  parcelSize: ParcelSize;
  busId?: string;
  description?: string;
  fare: number;
}

/**
 * Response of POST /consignments/:id/handover (ConsignmentsService.initiateHandover).
 * `handoverPin` is the plaintext 6-digit PIN — the backend only ever stores its hash
 * (DeliveryProof.codeHash), so this is the ONE time the raw PIN is retrievable. It cannot
 * be fetched again later. `handoverPinExpiresAt` is a JS Date serialized to ISO by Express's
 * JSON response, same as every other DateTime field.
 */
export interface HandoverInitiationResult extends Consignment {
  handoverPin: string;
  handoverPinExpiresAt: string;
}

export const ProofType = {
  QR: 'QR',
  PIN: 'PIN',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- const + type union is the intended enum-like pattern
export type ProofType = (typeof ProofType)[keyof typeof ProofType];

/**
 * Prisma `DeliveryProof` model, as returned verbatim (no `select`) in
 * POST /consignments/:id/handover/verify's response. `codeHash`/`nonce` are included because
 * the backend returns the full row — they're the PIN's one-way hash and salt, not the PIN itself.
 */
export interface DeliveryProof {
  id: string;
  consignmentId: string;
  type: ProofType;
  codeHash: string;
  nonce: string;
  expiresAt: string;
  verifiedAt: string | null;
  createdAt: string;
  attempts: number;
}

/** Body for POST /consignments/:id/handover/verify. Backend validates `pin` against /^\d{6}$/. */
export interface VerifyHandoverRequest {
  pin: string;
}

/**
 * Response of POST /consignments/:id/handover/verify (ConsignmentsService.verifyHandover) —
 * unlike book/accept/handover/cancel, this does NOT return a flat Consignment directly; it
 * wraps both the updated consignment and the now-verified DeliveryProof.
 */
export interface VerifyHandoverResult {
  consignment: Consignment;
  proof: DeliveryProof;
}
