import { apiClient } from './client';
import type { AvailableHalt, AvailableRoute } from '../../types';

/**
 * Wraps services/api's SenderRoutesController
 * (services/api/src/routes/sender-routes.controller.ts on origin/feat/backend).
 * @Roles('SENDER') only. No global route prefix, same as the rest of the API.
 */

/** GET /routes/available — SIMULATED routes only, narrow DTO (see types/sender.ts). */
export async function listAvailableRoutes(): Promise<AvailableRoute[]> {
  const { data } = await apiClient.get<AvailableRoute[]>('/routes/available');
  return data;
}

/**
 * GET /routes/available/:routeId/halts — ordered by sequence ascending.
 * 404s (as "Route not found") for a route that doesn't exist OR isn't
 * SIMULATED — the backend never distinguishes the two, by design.
 */
export async function listAvailableHalts(routeId: string): Promise<AvailableHalt[]> {
  const { data } = await apiClient.get<AvailableHalt[]>(`/routes/available/${routeId}/halts`);
  return data;
}
