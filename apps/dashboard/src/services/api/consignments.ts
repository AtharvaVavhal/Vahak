import { apiClient } from './client';
import type { ConsignmentDetail } from '../../types';

/**
 * Wraps services/api's ConsignmentsController (services/api/src/consignments/consignments.controller.ts
 * on origin/feat/backend). Only GET /consignments/:id is usable from an admin dashboard:
 * - No admin-wide listing/filter endpoint exists (verified live: `?status=` is silently
 *   ignored; GET /consignments only ever returns the caller's own sender-owned records,
 *   which is always empty for an ADMIN account).
 * - ADMIN has no mutation capability on consignments (create/accept/handover/cancel are all
 *   role-locked to SENDER/CONDUCTOR/RECIPIENT specifically — verified live: 403 for ADMIN).
 */
export async function getConsignmentById(id: string): Promise<ConsignmentDetail> {
  const { data } = await apiClient.get<ConsignmentDetail>(`/consignments/${id}`);
  return data;
}
