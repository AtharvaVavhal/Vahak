/**
 * Approved OSM relation allowlist for the PMPML pilot.
 *
 * These 14 relation IDs (covering 9 distinct PMPML route numbers) were
 * individually verified during research: each is tagged type=route,
 * route=bus, operator=PMPML, carries no fixme tag, and has real ordered
 * stop/platform members (13-63 each).
 *
 * Explicitly excluded, and must never be added here without re-verifying:
 *   - 8901755 (ref 100) — type=public_transport/stop_area, not a route
 *     relation; cannot supply an ordered stop sequence.
 *   - 21003980 (ref 100) — type=route but only 1 member, 0 stops usable.
 *   - Every relation for refs 77, 208, 43A — all fixme-flagged, no
 *     usable non-fixme relation exists for those route numbers.
 *
 * This file is the single source of truth for "what may be imported" —
 * osm-import.ts refuses to write any relation whose ID is not listed here,
 * even if Overpass itself would return it for a broader query.
 */

export interface ApprovedRelation {
  relationId: string;
  routeRef: string;
}

export const APPROVED_PMPML_RELATIONS: ApprovedRelation[] = [
  { relationId: '21034964', routeRef: '5' },
  { relationId: '3749749', routeRef: '81' },
  { relationId: '3749750', routeRef: '81' },
  { relationId: '3758341', routeRef: '94' },
  { relationId: '21089355', routeRef: '100C' },
  { relationId: '21089356', routeRef: '100C' },
  { relationId: '20029594', routeRef: '114' },
  { relationId: '20029595', routeRef: '114' },
  { relationId: '20273379', routeRef: '124' },
  { relationId: '20599836', routeRef: '208B' },
  { relationId: '2891803', routeRef: '256' },
  { relationId: '20269305', routeRef: '256' },
  { relationId: '3755944', routeRef: '283' },
  { relationId: '3755948', routeRef: '283' },
];

export const OSM_PROVIDER = 'osm';

export function osmRelationPermalink(relationId: string): string {
  return `https://www.openstreetmap.org/relation/${relationId}`;
}

export function osmNodePermalink(nodeId: string): string {
  return `https://www.openstreetmap.org/node/${nodeId}`;
}
