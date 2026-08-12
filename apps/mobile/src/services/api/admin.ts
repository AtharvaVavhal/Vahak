import { apiClient } from './client';
import type {
  Bus,
  CreateBusRequest,
  CreateHaltRequest,
  CreateRouteRequest,
  Halt,
  PaginatedRoutes,
  Route,
  RouteWithRelations,
  UpdateBusRequest,
  UpdateHaltRequest,
  UpdateRouteRequest,
} from '../../types';

/**
 * Wraps services/api's RoutesController, HaltsController/HaltsSingleController, and
 * BusesController/BusesSingleController (services/api/src/routes/*.ts on origin/feat/backend).
 * No global route prefix, same as the rest of the API. All writes are @Roles('ADMIN').
 *
 * There is no admin-wide consignment list/filter endpoint and no user-management endpoint at
 * all — not wired here because they don't exist on the backend.
 */

// --- Routes ---

/** GET /routes — @Roles('ADMIN', 'CONDUCTOR'). */
export async function listRoutes(page = 1, limit = 20): Promise<PaginatedRoutes> {
  const { data } = await apiClient.get<PaginatedRoutes>('/routes', { params: { page, limit } });
  return data;
}

/** GET /routes/:id — includes nested halts/buses. */
export async function getRoute(id: string): Promise<RouteWithRelations> {
  const { data } = await apiClient.get<RouteWithRelations>(`/routes/${id}`);
  return data;
}

/** POST /routes — @Roles('ADMIN'). Returns the flat Route (no relations). */
export async function createRoute(payload: CreateRouteRequest): Promise<Route> {
  const { data } = await apiClient.post<Route>('/routes', payload);
  return data;
}

/** PATCH /routes/:id — @Roles('ADMIN'). Returns the flat Route (no relations). */
export async function updateRoute(id: string, payload: UpdateRouteRequest): Promise<Route> {
  const { data } = await apiClient.patch<Route>(`/routes/${id}`, payload);
  return data;
}

/**
 * DELETE /routes/:id — @Roles('ADMIN'). 400s if halts/buses/consignments still reference it
 * (Prisma restrict). RoutesService.remove() awaits the delete but never returns it, so the
 * response body is empty (verified live: Content-Length: 0) — not the deleted Route.
 */
export async function deleteRoute(id: string): Promise<void> {
  await apiClient.delete(`/routes/${id}`);
}

// --- Halts ---

/** GET /routes/:routeId/halts — @Roles('ADMIN', 'CONDUCTOR'). Ordered by sequence. */
export async function listHaltsByRoute(routeId: string): Promise<Halt[]> {
  const { data } = await apiClient.get<Halt[]>(`/routes/${routeId}/halts`);
  return data;
}

/** GET /halts/:id — @Roles('ADMIN', 'CONDUCTOR'). */
export async function getHalt(id: string): Promise<Halt> {
  const { data } = await apiClient.get<Halt>(`/halts/${id}`);
  return data;
}

/** POST /routes/:routeId/halts — @Roles('ADMIN'). `sequence` must be unique within the route. */
export async function createHalt(routeId: string, payload: CreateHaltRequest): Promise<Halt> {
  const { data } = await apiClient.post<Halt>(`/routes/${routeId}/halts`, payload);
  return data;
}

/** PATCH /halts/:id — @Roles('ADMIN'). */
export async function updateHalt(id: string, payload: UpdateHaltRequest): Promise<Halt> {
  const { data } = await apiClient.patch<Halt>(`/halts/${id}`, payload);
  return data;
}

/**
 * DELETE /halts/:id — @Roles('ADMIN'). 400s if referenced by existing consignments.
 * Empty response body, same reason as deleteRoute — verified live.
 */
export async function deleteHalt(id: string): Promise<void> {
  await apiClient.delete(`/halts/${id}`);
}

// --- Buses ---

/** GET /routes/:routeId/buses — @Roles('ADMIN', 'CONDUCTOR'). */
export async function listBusesByRoute(routeId: string): Promise<Bus[]> {
  const { data } = await apiClient.get<Bus[]>(`/routes/${routeId}/buses`);
  return data;
}

/** GET /buses/:id — @Roles('ADMIN', 'CONDUCTOR'). */
export async function getBus(id: string): Promise<Bus> {
  const { data } = await apiClient.get<Bus>(`/buses/${id}`);
  return data;
}

/** POST /routes/:routeId/buses — @Roles('ADMIN'). `registration` must be globally unique. */
export async function createBus(routeId: string, payload: CreateBusRequest): Promise<Bus> {
  const { data } = await apiClient.post<Bus>(`/routes/${routeId}/buses`, payload);
  return data;
}

/** PATCH /buses/:id — @Roles('ADMIN'). Also the only way to toggle `active`. */
export async function updateBus(id: string, payload: UpdateBusRequest): Promise<Bus> {
  const { data } = await apiClient.patch<Bus>(`/buses/${id}`, payload);
  return data;
}

/**
 * DELETE /buses/:id — @Roles('ADMIN'). Bus.consignments use SetNull, so no restrict error
 * expected. Empty response body, same reason as deleteRoute — verified live.
 */
export async function deleteBus(id: string): Promise<void> {
  await apiClient.delete(`/buses/${id}`);
}
