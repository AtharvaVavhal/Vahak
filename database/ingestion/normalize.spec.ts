import {
  normalizeRelation,
  isContiguousSequence,
  findDuplicateExternalIds,
  type NormalizedRoute,
} from './normalize';
import type { OverpassNode, OverpassRelation } from './overpass';

const APPROVED_ID = '21034964'; // ref "5", per relations.ts
const UNAPPROVED_ID = '999999999';

function baseRelation(overrides: Partial<OverpassRelation['tags']> = {}): OverpassRelation {
  return {
    type: 'relation',
    id: Number(APPROVED_ID),
    tags: {
      type: 'route',
      route: 'bus',
      operator: 'PMPML',
      name: 'Bus 5: Pune Station => Swargate',
      ref: '5',
      from: 'Pune Station',
      to: 'Swargate',
      ...overrides,
    },
    members: [
      { type: 'node', ref: 1001, role: 'stop' },
      { type: 'way', ref: 5001, role: 'stop' }, // geometry between stops
      { type: 'node', ref: 1002, role: 'platform' },
      { type: 'way', ref: 5002, role: 'platform' },
      { type: 'node', ref: 1003, role: 'stop' },
    ],
  };
}

function node(id: number, lat: number, lon: number, name = `Stop ${id}`): OverpassNode {
  return { type: 'node', id, lat, lon, tags: { name } };
}

function nodeMap(...nodes: OverpassNode[]): Map<string, OverpassNode> {
  return new Map(nodes.map((n) => [String(n.id), n]));
}

const validNodes = () =>
  nodeMap(node(1001, 18.53, 73.87), node(1002, 18.52, 73.86), node(1003, 18.5, 73.85));

describe('normalizeRelation', () => {
  it('accepts a valid PMPML route and produces a contiguous, correctly-shaped result', () => {
    const result = normalizeRelation(APPROVED_ID, baseRelation(), validNodes());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.route.externalId).toBe(APPROVED_ID);
    expect(result.route.routeRef).toBe('5');
    expect(result.route.name).toBe('Bus 5: Pune Station => Swargate');
    expect(result.route.origin).toBe('Pune Station');
    expect(result.route.destination).toBe('Swargate');
    expect(result.route.sourceUrl).toBe('https://www.openstreetmap.org/relation/21034964');
    expect(result.route.halts).toHaveLength(3);
    expect(result.route.halts.map((h) => h.sequence)).toEqual([1, 2, 3]);
    expect(result.route.halts.map((h) => h.osmNodeId)).toEqual(['1001', '1002', '1003']);
    expect(result.route.halts[0].externalId).toBe('21034964:1001');
    expect(result.route.halts[0].sourceUrl).toBe('https://www.openstreetmap.org/node/1001');
  });

  it('leaves direction null when the relation carries no direction tag', () => {
    const result = normalizeRelation(APPROVED_ID, baseRelation(), validNodes());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.route.direction).toBeNull();
  });

  it('does not treat roundtrip as a direction value', () => {
    const relation = baseRelation({ roundtrip: 'no' });
    const result = normalizeRelation(APPROVED_ID, relation, validNodes());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.route.direction).toBeNull();
  });

  it('captures an explicit direction tag verbatim when present', () => {
    const relation = baseRelation({ direction: 'clockwise' });
    const result = normalizeRelation(APPROVED_ID, relation, validNodes());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.route.direction).toBe('clockwise');
  });

  it('treats a blank/whitespace-only direction tag as absent', () => {
    const relation = baseRelation({ direction: '   ' });
    const result = normalizeRelation(APPROVED_ID, relation, validNodes());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.route.direction).toBeNull();
  });

  it('skips way-typed stop/platform members and counts them without inferring coordinates', () => {
    const result = normalizeRelation(APPROVED_ID, baseRelation(), validNodes());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.route.skippedWayPlatformCount).toBe(2);
    // The two way members must not have produced any halt.
    expect(result.route.halts.every((h) => h.osmNodeId !== '5001' && h.osmNodeId !== '5002')).toBe(
      true,
    );
  });

  it('produces a contiguous 1..N sequence after filtering, verified via isContiguousSequence', () => {
    const result = normalizeRelation(APPROVED_ID, baseRelation(), validNodes());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(isContiguousSequence(result.route.halts)).toBe(true);
  });

  it('rejects a relation not on the approved allowlist', () => {
    const result = normalizeRelation(UNAPPROVED_ID, baseRelation(), validNodes());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.rejection.reason).toBe('NOT_IN_ALLOWLIST');
  });

  it('rejects a relation with the wrong type tag (e.g. a stop_area, not a route)', () => {
    const relation = baseRelation({ type: 'public_transport' });
    const result = normalizeRelation(APPROVED_ID, relation, validNodes());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.rejection.reason).toBe('WRONG_TYPE');
  });

  it('rejects a relation with the wrong operator', () => {
    const relation = baseRelation({ operator: 'MSRTC' });
    const result = normalizeRelation(APPROVED_ID, relation, validNodes());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.rejection.reason).toBe('WRONG_OPERATOR');
  });

  it('rejects a relation with no usable (node-typed) stop members', () => {
    const relation = baseRelation();
    relation.members = [
      { type: 'way', ref: 5001, role: 'stop' },
      { type: 'way', ref: 5002, role: 'platform' },
    ];
    const result = normalizeRelation(APPROVED_ID, relation, validNodes());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.rejection.reason).toBe('NO_USABLE_STOP_MEMBERS');
  });

  it('rejects a relation with a dangling node reference (member not resolved by Overpass)', () => {
    const partialNodes = nodeMap(node(1001, 18.53, 73.87)); // 1002/1003 missing
    const result = normalizeRelation(APPROVED_ID, baseRelation(), partialNodes);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.rejection.reason).toBe('DANGLING_NODE_REFERENCE');
  });

  it('rejects a relation whose resolved node has invalid/out-of-bounds coordinates', () => {
    const badNodes = nodeMap(
      node(1001, 0, 0), // zero coordinates
      node(1002, 18.52, 73.86),
      node(1003, 18.5, 73.85),
    );
    const result = normalizeRelation(APPROVED_ID, baseRelation(), badNodes);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.rejection.reason).toBe('INVALID_COORDINATES');
  });

  it('rejects a relation with a duplicate node in its own stop sequence', () => {
    const relation = baseRelation();
    relation.members = [
      { type: 'node', ref: 1001, role: 'stop' },
      { type: 'node', ref: 1002, role: 'stop' },
      { type: 'node', ref: 1001, role: 'stop' }, // repeats the first stop
    ];
    const result = normalizeRelation(APPROVED_ID, relation, validNodes());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.rejection.reason).toBe('DUPLICATE_NODE_IN_RELATION');
  });

  it('rejects a relation missing required route metadata (name/from/to)', () => {
    const relation = baseRelation({ from: undefined });
    const result = normalizeRelation(APPROVED_ID, relation, validNodes());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.rejection.reason).toBe('MISSING_ROUTE_METADATA');
  });

  it('rejects a relation whose stop node has no usable name', () => {
    const unnamedNodes = nodeMap(
      { type: 'node', id: 1001, lat: 18.53, lon: 73.87 }, // no tags at all
      node(1002, 18.52, 73.86),
      node(1003, 18.5, 73.85),
    );
    const result = normalizeRelation(APPROVED_ID, baseRelation(), unnamedNodes);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.rejection.reason).toBe('MISSING_STOP_NAME');
  });

  it('returns null for a relation Overpass could not find', () => {
    const result = normalizeRelation(APPROVED_ID, null, validNodes());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.rejection.reason).toBe('RELATION_NOT_FOUND');
  });
});

describe('findDuplicateExternalIds', () => {
  it('detects duplicate external IDs across a batch of normalized routes', () => {
    const route: NormalizedRoute = {
      externalId: 'R1',
      routeRef: '5',
      name: 'x',
      origin: 'a',
      destination: 'b',
      direction: null,
      sourceUrl: 'u',
      skippedWayPlatformCount: 0,
      halts: [
        {
          externalId: 'R1:1',
          osmNodeId: '1',
          name: 'x',
          sequence: 1,
          latitude: 1,
          longitude: 1,
          sourceUrl: 'u',
        },
      ],
    };
    // Distinct route with its own distinct halt, but a colliding route-level externalId.
    const duplicateRoute: NormalizedRoute = {
      ...route,
      halts: [{ ...route.halts[0], externalId: 'R2:1' }],
    };

    expect(findDuplicateExternalIds([route, duplicateRoute])).toEqual(['R1']);
    expect(findDuplicateExternalIds([route])).toEqual([]);
  });
});
