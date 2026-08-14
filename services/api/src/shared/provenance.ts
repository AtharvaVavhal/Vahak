import type { Bus, Halt, Route } from '../generated/prisma/client';

/**
 * Internal provenance/lineage fields (dataSource, provider, externalId,
 * sourceUrl, fetchedAt) exist so admins and ingestion tooling can trace
 * where a Route/Halt/Bus row came from. They must never reach
 * SENDER/CONDUCTOR/RECIPIENT-facing responses — only ADMIN is allowed to
 * see them. These are the single, shared conversion functions every
 * non-admin-reachable endpoint that can return a Route/Halt/Bus (directly
 * or nested inside a Consignment) must route its response through.
 *
 * Deliberately an allowlist (explicitly listing the fields to keep) rather
 * than a denylist (destructuring the five fields away): a future schema
 * field added to Route/Halt/Bus is excluded by default here unless someone
 * deliberately adds it, instead of silently leaking.
 */

export interface PublicRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  routeRef: string | null;
  direction: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicHalt {
  id: string;
  routeId: string;
  name: string;
  sequence: number;
  latitude: Halt['latitude'];
  longitude: Halt['longitude'];
}

export interface PublicBus {
  id: string;
  registration: string;
  routeId: string;
  active: boolean;
  createdAt: Date;
}

export function toPublicRoute(route: Route): PublicRoute {
  return {
    id: route.id,
    name: route.name,
    origin: route.origin,
    destination: route.destination,
    routeRef: route.routeRef,
    direction: route.direction,
    createdAt: route.createdAt,
    updatedAt: route.updatedAt,
  };
}

export function toPublicHalt(halt: Halt): PublicHalt {
  return {
    id: halt.id,
    routeId: halt.routeId,
    name: halt.name,
    sequence: halt.sequence,
    latitude: halt.latitude,
    longitude: halt.longitude,
  };
}

export function toPublicBus(bus: Bus): PublicBus {
  return {
    id: bus.id,
    registration: bus.registration,
    routeId: bus.routeId,
    active: bus.active,
    createdAt: bus.createdAt,
  };
}
