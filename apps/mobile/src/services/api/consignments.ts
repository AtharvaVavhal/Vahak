import { apiClient } from './client';
import type {
  Consignment,
  ConsignmentDetail,
  ConsignmentListItem,
  CreateConsignmentRequest,
  HandoverInitiationResult,
  VerifyHandoverResult,
} from '../../types';

/**
 * Wraps services/api's ConsignmentsController (services/api/src/consignments/consignments.controller.ts
 * on origin/feat/backend). No global route prefix, same as the rest of the API.
 */

/** POST /consignments — @Roles('SENDER'). Creates a consignment in CREATED status. */
export async function createConsignment(payload: CreateConsignmentRequest): Promise<Consignment> {
  const { data } = await apiClient.post<Consignment>('/consignments', payload);
  return data;
}

/** POST /consignments/:id/book — @Roles('SENDER'), owner-only. CREATED -> BOOKED. */
export async function bookConsignment(id: string): Promise<Consignment> {
  const { data } = await apiClient.post<Consignment>(`/consignments/${id}/book`);
  return data;
}

/** POST /consignments/:id/cancel — @Roles('SENDER'), owner-only. Any active status -> CANCELLED. */
export async function cancelConsignment(id: string): Promise<Consignment> {
  const { data } = await apiClient.post<Consignment>(`/consignments/${id}/cancel`);
  return data;
}

/** GET /consignments (findMine) — returns consignments where senderId === current user. */
export async function getMyConsignments(): Promise<ConsignmentListItem[]> {
  const { data } = await apiClient.get<ConsignmentListItem[]>('/consignments');
  return data;
}

/** GET /consignments/:id (findById) — no server-side ownership check on this endpoint. */
export async function getConsignmentById(id: string): Promise<ConsignmentDetail> {
  const { data } = await apiClient.get<ConsignmentDetail>(`/consignments/${id}`);
  return data;
}

/**
 * POST /consignments/:id/accept — @Roles('CONDUCTOR'). Requires status BOOKED (any conductor
 * may accept — there's no route/assignment matching). Assigns conductorId, BOOKED -> ACCEPTED.
 */
export async function acceptConsignment(id: string): Promise<Consignment> {
  const { data } = await apiClient.post<Consignment>(`/consignments/${id}/accept`);
  return data;
}

/**
 * POST /consignments/:id/handover — @Roles('CONDUCTOR'), and only the conductor who accepted it
 * (consignment.conductorId must match). Requires status ACCEPTED. ACCEPTED -> IN_TRANSIT, and
 * generates a one-time handover PIN (see HandoverInitiationResult).
 */
export async function initiateHandover(id: string): Promise<HandoverInitiationResult> {
  const { data } = await apiClient.post<HandoverInitiationResult>(`/consignments/${id}/handover`);
  return data;
}

/**
 * POST /consignments/:id/handover/verify — @Roles('RECIPIENT'), and only the recipient the
 * consignment names (consignment.recipientId must match). Requires status IN_TRANSIT and a
 * 6-digit PIN. The backend does the actual hash comparison — the PIN is only ever sent here,
 * never hashed, compared, or persisted on the client. IN_TRANSIT -> DELIVERED on success.
 */
export async function verifyHandover(id: string, pin: string): Promise<VerifyHandoverResult> {
  const { data } = await apiClient.post<VerifyHandoverResult>(`/consignments/${id}/handover/verify`, {
    pin,
  });
  return data;
}
