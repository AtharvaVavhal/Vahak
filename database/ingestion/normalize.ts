/**
 * Pure validation/normalization logic: raw Overpass relation + resolved
 * nodes -> a validated NormalizedRoute ready to upsert, or a rejection with
 * a concrete reason. No network calls and no database writes happen here.
 */
import { APPROVED_PMPML_RELATIONS, osmNodePermalink, osmRelationPermalink } from './relations';
import type { OverpassNode, OverpassRelation } from './overpass';

// PTv2 roles that represent an actual stop/platform position. Way-typed
// members with these roles are deliberately NOT included here — we do not
// infer a representative point from a way's geometry (no centroid
// calculation, no "use the first node" shortcut). They are counted and
// reported instead; see skippedWayPlatformCount below.
const STOP_ROLES = new Set([
  'stop',
  'platform',
  'stop_entry_only',
  'stop_exit_only',
  'platform_entry_only',
  'platform_exit_only',
]);

// Generous Maharashtra/Pune-metro bounding box. Wide enough to include
// PMPML's confirmed extended service area (real stops were found up to
// ~74.16° longitude during prior research) while still catching genuinely
// invalid coordinates (zero, null, wrong hemisphere, off-by-one-degree).
const LAT_MIN = 18.0;
const LAT_MAX = 19.5;
const LON_MIN = 73.0;
const LON_MAX = 75.0;

export interface NormalizedHalt {
  /** "<relationId>:<osmNodeId>" — see multi-route-stop note in README.md. */
  externalId: string;
  osmNodeId: string;
  name: string;
  sequence: number;
  latitude: number;
  longitude: number;
  sourceUrl: string;
}

export interface NormalizedRoute {
  /** Bare OSM relation ID — Route is not shared across relations, so no composite is needed. */
  externalId: string;
  routeRef: string;
  name: string;
  origin: string;
  destination: string;
  /**
   * Only ever set from an explicit `direction` tag on the relation itself —
   * never inferred from geography, origin/destination, stop sequence, or
   * route naming. Null when the relation carries no such tag, which is the
   * common case: none of the PMPML relations approved as of Milestone 3
   * carry a `direction` tag (a small number carry `roundtrip`, a distinct
   * concept — whether the route loops — that must not be reused as if it
   * were direction).
   */
  direction: string | null;
  sourceUrl: string;
  halts: NormalizedHalt[];
  skippedWayPlatformCount: number;
}

export type RejectionReason =
  | 'NOT_IN_ALLOWLIST'
  | 'RELATION_NOT_FOUND'
  | 'WRONG_TYPE'
  | 'WRONG_ROUTE_TAG'
  | 'WRONG_OPERATOR'
  | 'MISSING_ROUTE_METADATA'
  | 'NO_USABLE_STOP_MEMBERS'
  | 'DUPLICATE_NODE_IN_RELATION'
  | 'DANGLING_NODE_REFERENCE'
  | 'INVALID_COORDINATES'
  | 'MISSING_STOP_NAME';

export interface RejectedRelation {
  relationId: string;
  reason: RejectionReason;
  detail: string;
}

export type NormalizeResult =
  { ok: true; route: NormalizedRoute } | { ok: false; rejection: RejectedRelation };

function reject(relationId: string, reason: RejectionReason, detail: string): NormalizeResult {
  return { ok: false, rejection: { relationId, reason, detail } };
}

export function normalizeRelation(
  relationId: string,
  relation: OverpassRelation | null,
  resolvedNodes: Map<string, OverpassNode>,
): NormalizeResult {
  const approved = APPROVED_PMPML_RELATIONS.find((r) => r.relationId === relationId);
  if (!approved) {
    return reject(
      relationId,
      'NOT_IN_ALLOWLIST',
      `${relationId} is not on the approved relation allowlist`,
    );
  }

  if (!relation) {
    return reject(relationId, 'RELATION_NOT_FOUND', 'Overpass returned no relation with this ID');
  }

  if (relation.tags.type !== 'route') {
    return reject(relationId, 'WRONG_TYPE', `tags.type="${relation.tags.type}", expected "route"`);
  }
  if (relation.tags.route !== 'bus') {
    return reject(
      relationId,
      'WRONG_ROUTE_TAG',
      `tags.route="${relation.tags.route}", expected "bus"`,
    );
  }
  if (relation.tags.operator !== 'PMPML') {
    return reject(
      relationId,
      'WRONG_OPERATOR',
      `tags.operator="${relation.tags.operator}", expected "PMPML"`,
    );
  }

  const name = relation.tags.name?.trim();
  const origin = relation.tags.from?.trim();
  const destination = relation.tags.to?.trim();
  if (!name || !origin || !destination) {
    return reject(
      relationId,
      'MISSING_ROUTE_METADATA',
      `Missing required tag(s): ${[!name && 'name', !origin && 'from', !destination && 'to'].filter(Boolean).join(', ')}`,
    );
  }

  // Explicit-only: read a `direction` tag verbatim if present, never derive
  // one from any other field. `roundtrip` (seen on some approved relations)
  // is a different concept — whether the route loops — and is deliberately
  // not treated as a direction value here.
  const rawDirection = relation.tags.direction?.trim();
  const direction = rawDirection && rawDirection.length > 0 ? rawDirection : null;

  const stopRoleMembers = relation.members.filter((m) => STOP_ROLES.has(m.role));
  const nodeStopMembers = stopRoleMembers.filter((m) => m.type === 'node');
  const skippedWayPlatformCount = stopRoleMembers.filter((m) => m.type === 'way').length;

  if (nodeStopMembers.length === 0) {
    return reject(
      relationId,
      'NO_USABLE_STOP_MEMBERS',
      'No node-typed stop/platform members after filtering',
    );
  }

  const seenNodeIds = new Set<string>();
  for (const member of nodeStopMembers) {
    const nodeId = String(member.ref);
    if (seenNodeIds.has(nodeId)) {
      return reject(
        relationId,
        'DUPLICATE_NODE_IN_RELATION',
        `Node ${nodeId} appears more than once in this relation's stop sequence`,
      );
    }
    seenNodeIds.add(nodeId);
  }

  const halts: NormalizedHalt[] = [];
  let sequence = 0;
  for (const member of nodeStopMembers) {
    const nodeId = String(member.ref);
    const node = resolvedNodes.get(nodeId);
    if (!node) {
      return reject(
        relationId,
        'DANGLING_NODE_REFERENCE',
        `Node ${nodeId} is referenced by the relation but was not resolved by Overpass`,
      );
    }

    const lat = node.lat;
    const lon = node.lon;
    if (
      typeof lat !== 'number' ||
      typeof lon !== 'number' ||
      lat === 0 ||
      lon === 0 ||
      lat < LAT_MIN ||
      lat > LAT_MAX ||
      lon < LON_MIN ||
      lon > LON_MAX
    ) {
      return reject(
        relationId,
        'INVALID_COORDINATES',
        `Node ${nodeId} has lat=${String(lat)} lon=${String(lon)}, outside plausible bounds`,
      );
    }

    const stopName = node.tags?.name?.trim();
    if (!stopName) {
      return reject(relationId, 'MISSING_STOP_NAME', `Node ${nodeId} has no usable name tag`);
    }

    sequence += 1;
    halts.push({
      externalId: `${relationId}:${nodeId}`,
      osmNodeId: nodeId,
      name: stopName,
      sequence,
      latitude: lat,
      longitude: lon,
      sourceUrl: osmNodePermalink(nodeId),
    });
  }

  return {
    ok: true,
    route: {
      externalId: relationId,
      routeRef: approved.routeRef,
      name,
      origin,
      destination,
      direction,
      sourceUrl: osmRelationPermalink(relationId),
      halts,
      skippedWayPlatformCount,
    },
  };
}

/** True if halt sequences are exactly 1..N with no gaps or duplicates. */
export function isContiguousSequence(halts: NormalizedHalt[]): boolean {
  return halts.every((h, i) => h.sequence === i + 1);
}

/** Finds any externalId that appears more than once across an entire normalized batch. */
export function findDuplicateExternalIds(routes: NormalizedRoute[]): string[] {
  const counts = new Map<string, number>();
  for (const route of routes) {
    counts.set(route.externalId, (counts.get(route.externalId) ?? 0) + 1);
    for (const halt of route.halts) {
      counts.set(halt.externalId, (counts.get(halt.externalId) ?? 0) + 1);
    }
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id);
}
