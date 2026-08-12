/**
 * Mirrors services/api's RoutesController, HaltsController/HaltsSingleController, and
 * BusesController/BusesSingleController (services/api/src/routes/*.ts on origin/feat/backend).
 * No global route prefix. All writes are @Roles('ADMIN'); reads are @Roles('ADMIN', 'CONDUCTOR').
 *
 * Route/Halt/Bus's flat field shapes are identical to the relation summaries already used by
 * the consignment domain, so they're reused directly rather than redefined.
 */
import type { ConsignmentBusSummary, ConsignmentHaltSummary, ConsignmentRouteSummary } from './consignment';

export type Route = ConsignmentRouteSummary;
export type Halt = ConsignmentHaltSummary;
export type Bus = ConsignmentBusSummary;

/** GET /routes and GET /routes/:id include nested halts/buses; the flat mutation endpoints don't. */
export interface RouteWithRelations extends Route {
  halts: Halt[];
  buses: Bus[];
}

/** Response of GET /routes (RoutesService.findAll). */
export interface PaginatedRoutes {
  data: RouteWithRelations[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Body for POST /routes (services/api/src/routes/dto/create-route.dto.ts). All fields required. */
export interface CreateRouteRequest {
  name: string;
  origin: string;
  destination: string;
}

/** Body for PATCH /routes/:id — PartialType(CreateRouteDto), every field optional. */
export type UpdateRouteRequest = Partial<CreateRouteRequest>;

/**
 * Body for POST /routes/:routeId/halts (services/api/src/routes/dto/create-halt.dto.ts).
 * `sequence` must be a positive integer, unique per route. latitude/longitude are optional
 * plain numbers as *input* — the backend still stores/returns them as Decimal-serialized strings.
 */
export interface CreateHaltRequest {
  name: string;
  sequence: number;
  latitude?: number;
  longitude?: number;
}

/** Body for PATCH /halts/:id — PartialType(CreateHaltDto). */
export type UpdateHaltRequest = Partial<CreateHaltRequest>;

/** Body for POST /routes/:routeId/buses (services/api/src/routes/dto/create-bus.dto.ts). */
export interface CreateBusRequest {
  registration: string;
}

/** Body for PATCH /buses/:id — adds `active`, on top of PartialType(CreateBusDto). */
export interface UpdateBusRequest {
  registration?: string;
  active?: boolean;
}
