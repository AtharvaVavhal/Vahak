/**
 * Deterministic QA fixture definitions.
 *
 * No foreign-key UUIDs live here — every relationship is wired up in
 * qa-seed.ts using the IDs Prisma/the real services actually return.
 * No passwords or hashes live here either; qa-seed.ts owns credential
 * generation so this file is safe to read without exposing anything.
 *
 * Every phone number, route name, and bus registration below is reserved
 * for this QA dataset and must not be reused by real app data — qa-reset.ts
 * uses these exact values to scope its deletions.
 */

export type QaRole = 'ADMIN' | 'SENDER' | 'CONDUCTOR' | 'RECIPIENT';

export interface QaUserFixture {
  key: string;
  name: string;
  phone: string;
  email: string;
  role: QaRole;
}

/**
 * Four users exercise the primary lifecycle; three "unrelated" users exist
 * solely so the authorization checks (unrelated sender/recipient/conductor
 * must NOT see another user's consignment) have a fixed, reproducible
 * counterparty instead of relying on incidental dev-database data.
 */
export const QA_USERS: QaUserFixture[] = [
  {
    key: 'admin',
    name: 'QA Admin',
    phone: '9555000001',
    email: 'qa.admin@vahak.qa',
    role: 'ADMIN',
  },
  {
    key: 'sender',
    name: 'QA Sender',
    phone: '9555000002',
    email: 'qa.sender@vahak.qa',
    role: 'SENDER',
  },
  {
    key: 'conductor',
    name: 'QA Conductor',
    phone: '9555000003',
    email: 'qa.conductor@vahak.qa',
    role: 'CONDUCTOR',
  },
  {
    key: 'recipient',
    name: 'QA Recipient',
    phone: '9555000004',
    email: 'qa.recipient@vahak.qa',
    role: 'RECIPIENT',
  },
  {
    key: 'unrelatedSender',
    name: 'QA Unrelated Sender',
    phone: '9555000005',
    email: 'qa.unrelated.sender@vahak.qa',
    role: 'SENDER',
  },
  {
    key: 'unrelatedConductor',
    name: 'QA Unrelated Conductor',
    phone: '9555000006',
    email: 'qa.unrelated.conductor@vahak.qa',
    role: 'CONDUCTOR',
  },
  {
    key: 'unrelatedRecipient',
    name: 'QA Unrelated Recipient',
    phone: '9555000007',
    email: 'qa.unrelated.recipient@vahak.qa',
    role: 'RECIPIENT',
  },
];

export const QA_ROUTE = {
  name: 'QA Demo Route',
  origin: 'QA Origin Halt',
  destination: 'QA Destination Halt',
};

export const QA_HALTS = [
  { name: 'QA Halt A - Origin', sequence: 1 },
  { name: 'QA Halt B - Midpoint', sequence: 2 },
  { name: 'QA Halt C - Destination', sequence: 3 },
];

export const QA_BUS = {
  registration: 'QA-BUS-0001',
};

export type QaParcelSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export type QaLifecycleTarget =
  | 'CREATED'
  | 'BOOKED'
  | 'ACCEPTED'
  | 'IN_TRANSIT_ACTIVE'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'IN_TRANSIT_EXPIRED_PIN'
  | 'IN_TRANSIT_MAX_ATTEMPTS';

export interface QaConsignmentFixture {
  key: string;
  description: string;
  parcelSize: QaParcelSize;
  fare: number;
  targetLifecycle: QaLifecycleTarget;
}

/**
 * Descriptors only — qa-seed.ts drives each of these through the real
 * ConsignmentsService transition methods rather than writing status/event
 * rows directly, so the persisted shape always matches what the running
 * app itself would produce.
 */
export const QA_CONSIGNMENT_FIXTURES: QaConsignmentFixture[] = [
  {
    key: 'created',
    description: 'QA fixture — left in CREATED',
    parcelSize: 'SMALL',
    fare: 50,
    targetLifecycle: 'CREATED',
  },
  {
    key: 'booked',
    description: 'QA fixture — left in BOOKED',
    parcelSize: 'SMALL',
    fare: 60,
    targetLifecycle: 'BOOKED',
  },
  {
    key: 'accepted',
    description: 'QA fixture — left in ACCEPTED',
    parcelSize: 'MEDIUM',
    fare: 90,
    targetLifecycle: 'ACCEPTED',
  },
  {
    key: 'inTransitActive',
    description: 'QA fixture — IN_TRANSIT with a valid, unverified handover PIN',
    parcelSize: 'MEDIUM',
    fare: 120,
    targetLifecycle: 'IN_TRANSIT_ACTIVE',
  },
  {
    key: 'delivered',
    description: 'QA fixture — full happy path through DELIVERED',
    parcelSize: 'LARGE',
    fare: 150,
    targetLifecycle: 'DELIVERED',
  },
  {
    key: 'cancelled',
    description: 'QA fixture — CREATED then CANCELLED',
    parcelSize: 'SMALL',
    fare: 45,
    targetLifecycle: 'CANCELLED',
  },
  {
    key: 'inTransitExpiredPin',
    description: 'QA fixture — IN_TRANSIT with an intentionally expired handover PIN',
    parcelSize: 'MEDIUM',
    fare: 100,
    targetLifecycle: 'IN_TRANSIT_EXPIRED_PIN',
  },
  {
    key: 'inTransitMaxAttempts',
    description: 'QA fixture — IN_TRANSIT with a handover PIN at max failed attempts',
    parcelSize: 'MEDIUM',
    fare: 100,
    targetLifecycle: 'IN_TRANSIT_MAX_ATTEMPTS',
  },
];
