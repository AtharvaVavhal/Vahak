/**
 * Mirrors services/api's SenderRoutesController and its DTOs
 * (services/api/src/routes/sender-routes.{controller,service}.ts,
 * services/api/src/routes/dto/sender-{route,halt}.dto.ts on origin/feat/backend).
 *
 * Deliberately narrower than admin's Route/Halt (types/admin.ts): no provider,
 * externalId, sourceUrl, fetchedAt, or dataSource — the backend never sends
 * those fields to this endpoint at all, and these types reflect exactly what
 * comes back, not what the database row contains.
 *
 * @Roles('SENDER') only. Explicitly filtered server-side to dataSource=SIMULATED
 * — a COMMUNITY_DERIVED (OSM) route/halt can never appear here.
 */

/** Item of GET /routes/available. */
export interface AvailableRoute {
  id: string;
  routeRef: string | null;
  name: string;
  origin: string;
  destination: string;
}

/**
 * Item of GET /routes/available/:routeId/halts, already ordered by sequence
 * ascending — do not re-sort client-side.
 */
export interface AvailableHalt {
  id: string;
  name: string;
  sequence: number;
  latitude: number | null;
  longitude: number | null;
}
