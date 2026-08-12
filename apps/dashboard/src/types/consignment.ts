/**
 * Mirrors services/api's Consignment domain, read from database/prisma/schema.prisma
 * and services/api/src/consignments/{consignments.controller,consignments.service}.ts
 * on origin/feat/backend, and verified against live responses from the running API.
 */

export const ParcelSize = {
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE',
} as const;

export type ParcelSize = (typeof ParcelSize)[keyof typeof ParcelSize];

export const ConsignmentStatus = {
  CREATED: 'CREATED',
  BOOKED: 'BOOKED',
  ACCEPTED: 'ACCEPTED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

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
 * Shape returned by GET /consignments/:id (findById) — the only consignment endpoint an
 * ADMIN can call. No global-listing endpoint exists (findMine filters by senderId, which
 * is always empty for an admin account). No ownership check on this endpoint either —
 * any authenticated role can look up any consignment by ID.
 */
export interface ConsignmentDetail {
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
  /** Prisma Decimal, serialized as a string (verified live: "150", not 150). */
  fare: string;
  status: ConsignmentStatus;
  createdAt: string;
  updatedAt: string;
  sender: ConsignmentUserSummary;
  recipient: ConsignmentUserSummary;
  route: ConsignmentRouteSummary;
  pickupHalt: ConsignmentHaltSummary;
  dropoffHalt: ConsignmentHaltSummary;
  bus: ConsignmentBusSummary | null;
}
