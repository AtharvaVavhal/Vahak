import {
  computeStaleHalts,
  planWrites,
  executeWrites,
  StaleHaltReferencedError,
  type WritePlanItem,
} from './osm-write';
import { OSM_PROVIDER } from './relations';
import type { NormalizedRoute, NormalizedHalt } from './normalize';
import type { PrismaClient } from '../../services/api/src/generated/prisma/client';

function halt(externalId: string, sequence: number): NormalizedHalt {
  return {
    externalId,
    osmNodeId: externalId.split(':')[1],
    name: `Stop ${sequence}`,
    sequence,
    latitude: 18.5,
    longitude: 73.8,
    sourceUrl: `https://www.openstreetmap.org/node/${externalId.split(':')[1]}`,
  };
}

function route(overrides: Partial<NormalizedRoute> = {}): NormalizedRoute {
  return {
    externalId: '1000',
    routeRef: '5',
    name: 'Bus 5: A => B',
    origin: 'A',
    destination: 'B',
    direction: null,
    sourceUrl: 'https://www.openstreetmap.org/relation/1000',
    skippedWayPlatformCount: 0,
    halts: [halt('1000:1', 1), halt('1000:2', 2)],
    ...overrides,
  };
}

describe('computeStaleHalts', () => {
  it('flags an existing OSM halt whose externalId is absent from the fresh fetch as stale', () => {
    const fresh = [halt('1000:1', 1)];
    const existing = [
      { id: 'db-1', externalId: '1000:1' },
      { id: 'db-2', externalId: '1000:2' },
    ];
    expect(computeStaleHalts(fresh, existing)).toEqual([{ id: 'db-2', externalId: '1000:2' }]);
  });

  it('does not flag a halt still present in the fresh fetch (unchanged halt remains)', () => {
    const fresh = [halt('1000:1', 1), halt('1000:2', 2)];
    const existing = [
      { id: 'db-1', externalId: '1000:1' },
      { id: 'db-2', externalId: '1000:2' },
    ];
    expect(computeStaleHalts(fresh, existing)).toEqual([]);
  });

  it('does not flag a freshly fetched halt with no existing DB counterpart yet', () => {
    const fresh = [halt('1000:1', 1), halt('1000:3', 2)];
    const existing = [{ id: 'db-1', externalId: '1000:1' }];
    expect(computeStaleHalts(fresh, existing)).toEqual([]);
  });
});

interface MockTx {
  route: { upsert: jest.Mock };
  halt: { upsert: jest.Mock; findMany: jest.Mock; deleteMany: jest.Mock };
  consignment: { count: jest.Mock };
}

function makeTx(overrides: Partial<MockTx> = {}): MockTx {
  return {
    route: { upsert: jest.fn().mockResolvedValue({ id: 'route-db-id' }) },
    halt: {
      upsert: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    consignment: { count: jest.fn().mockResolvedValue(0) },
    ...overrides,
  };
}

function makePrisma(tx: MockTx) {
  return {
    $transaction: jest.fn(async (cb: (tx: MockTx) => Promise<unknown>) => cb(tx)),
    route: { findUnique: jest.fn() },
    halt: { findUnique: jest.fn(), findMany: jest.fn() },
    consignment: { count: jest.fn() },
  } as unknown as PrismaClient & {
    $transaction: jest.Mock;
    route: { findUnique: jest.Mock };
    halt: { findUnique: jest.Mock; findMany: jest.Mock };
    consignment: { count: jest.Mock };
  };
}

function planItem(r: NormalizedRoute, overrides: Partial<WritePlanItem> = {}): WritePlanItem {
  return {
    route: r,
    routeExists: false,
    haltsToCreate: r.halts.length,
    haltsToUpdate: 0,
    haltsToPrune: 0,
    haltsPruneBlockedByConsignment: 0,
    ...overrides,
  };
}

describe('executeWrites', () => {
  it('removes a stale halt no longer present in the fresh fetch', async () => {
    const r = route({ halts: [halt('1000:1', 1)] }); // node 2 dropped upstream
    const tx = makeTx({
      halt: {
        upsert: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([
          { id: 'db-1', externalId: '1000:1' },
          { id: 'db-2', externalId: '1000:2' },
        ]),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    });
    const prisma = makePrisma(tx);

    const results = await executeWrites(prisma, [planItem(r)], new Date());

    expect(results).toEqual([{ route: r, status: 'written', prunedCount: 1 }]);
    expect(tx.halt.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['db-2'] } } });
  });

  it('leaves an unchanged halt alone (not deleted)', async () => {
    const r = route({ halts: [halt('1000:1', 1), halt('1000:2', 2)] });
    const tx = makeTx({
      halt: {
        upsert: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([
          { id: 'db-1', externalId: '1000:1' },
          { id: 'db-2', externalId: '1000:2' },
        ]),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    });
    const prisma = makePrisma(tx);

    const results = await executeWrites(prisma, [planItem(r)], new Date());

    expect(results).toEqual([{ route: r, status: 'written', prunedCount: 0 }]);
    expect(tx.halt.deleteMany).not.toHaveBeenCalled();
  });

  it('inserts a newly fetched halt via upsert and never marks it stale', async () => {
    const r = route({ halts: [halt('1000:1', 1), halt('1000:3', 2)] }); // 1000:3 is new
    const tx = makeTx({
      halt: {
        upsert: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([{ id: 'db-1', externalId: '1000:1' }]),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    });
    const prisma = makePrisma(tx);

    const results = await executeWrites(prisma, [planItem(r)], new Date());

    expect(tx.halt.upsert).toHaveBeenCalledTimes(2);
    const calls = tx.halt.upsert.mock.calls as Array<
      [{ where: { provider_externalId: { externalId: string } }; create: { externalId: string } }]
    >;
    const newHaltCall = calls.find(
      ([arg]) => arg.where.provider_externalId.externalId === '1000:3',
    );
    expect(newHaltCall).toBeDefined();
    expect(newHaltCall?.[0].create.externalId).toBe('1000:3');
    expect(tx.halt.deleteMany).not.toHaveBeenCalled();
    expect(results[0].status).toBe('written');
  });

  it('aborts the relation, without deleting, when a stale halt is referenced by a Consignment', async () => {
    const r = route({ halts: [halt('1000:1', 1)] });
    const tx = makeTx({
      halt: {
        upsert: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([
          { id: 'db-1', externalId: '1000:1' },
          { id: 'db-2', externalId: '1000:2' },
        ]),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      consignment: { count: jest.fn().mockResolvedValue(2) },
    });
    const prisma = makePrisma(tx);

    const results = await executeWrites(prisma, [planItem(r)], new Date());

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('aborted');
    expect(results[0].prunedCount).toBe(0);
    expect(results[0].abortReason).toContain('1000');
    expect(results[0].abortReason).toContain('2 consignment(s)');
    expect(tx.halt.deleteMany).not.toHaveBeenCalled();
  });

  it('scopes the stale-halt query to this route and provider="osm" only (never SIMULATED/non-OSM rows)', async () => {
    const r = route();
    const tx = makeTx();
    const prisma = makePrisma(tx);

    await executeWrites(prisma, [planItem(r)], new Date());

    expect(tx.halt.findMany).toHaveBeenCalledWith({
      where: { routeId: 'route-db-id', provider: OSM_PROVIDER },
      select: { id: true, externalId: true },
    });
  });

  it('writes routeRef and direction on both create and update', async () => {
    const r = route({ routeRef: '81', direction: null });
    const tx = makeTx();
    const prisma = makePrisma(tx);

    await executeWrites(prisma, [planItem(r)], new Date());

    const [routeUpsertArg] = tx.route.upsert.mock.calls[0] as [
      {
        create: { routeRef: string; direction: string | null };
        update: { routeRef: string; direction: string | null };
      },
    ];
    expect(routeUpsertArg.create.routeRef).toBe('81');
    expect(routeUpsertArg.create.direction).toBeNull();
    expect(routeUpsertArg.update.routeRef).toBe('81');
    expect(routeUpsertArg.update.direction).toBeNull();
  });

  it('performs no writes at all when the plan is empty (rejected/fetch-failed relations never reach here)', async () => {
    const tx = makeTx();
    const prisma = makePrisma(tx);

    const results = await executeWrites(prisma, [], new Date());

    expect(results).toEqual([]);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- referencing a jest.fn() mock property, not a bound class method
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('planWrites', () => {
  it('computes haltsToPrune and leaves haltsPruneBlockedByConsignment at 0 when nothing references the stale halt', async () => {
    const r = route({ halts: [halt('1000:1', 1)] });
    const prisma = {
      route: { findUnique: jest.fn().mockResolvedValue({ id: 'route-db-id' }) },
      halt: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([
          { id: 'db-1', externalId: '1000:1' },
          { id: 'db-2', externalId: '1000:2' },
        ]),
      },
      consignment: { count: jest.fn().mockResolvedValue(0) },
    } as unknown as PrismaClient;

    const plan = await planWrites(prisma, [r]);

    expect(plan[0].haltsToPrune).toBe(1);
    expect(plan[0].haltsPruneBlockedByConsignment).toBe(0);
  });

  it('reports haltsPruneBlockedByConsignment when a stale halt is still referenced', async () => {
    const r = route({ halts: [halt('1000:1', 1)] });
    const prisma = {
      route: { findUnique: jest.fn().mockResolvedValue({ id: 'route-db-id' }) },
      halt: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([{ id: 'db-2', externalId: '1000:2' }]),
      },
      consignment: { count: jest.fn().mockResolvedValue(3) },
    } as unknown as PrismaClient;

    const plan = await planWrites(prisma, [r]);

    expect(plan[0].haltsToPrune).toBe(1);
    expect(plan[0].haltsPruneBlockedByConsignment).toBe(3);
  });

  it('skips prune computation entirely for a route that does not exist yet (nothing to prune against)', async () => {
    const r = route();
    const haltFindMany = jest.fn();
    const prisma = {
      route: { findUnique: jest.fn().mockResolvedValue(null) },
      halt: { findUnique: jest.fn().mockResolvedValue(null), findMany: haltFindMany },
      consignment: { count: jest.fn() },
    } as unknown as PrismaClient;

    const plan = await planWrites(prisma, [r]);

    expect(plan[0].haltsToPrune).toBe(0);
    expect(plan[0].haltsPruneBlockedByConsignment).toBe(0);
    expect(haltFindMany).not.toHaveBeenCalled();
  });
});

describe('StaleHaltReferencedError', () => {
  it('carries the relation id, consignment count, and halt external ids', () => {
    const err = new StaleHaltReferencedError('1000', 2, ['1000:2', '1000:3']);
    expect(err.relationId).toBe('1000');
    expect(err.consignmentCount).toBe(2);
    expect(err.haltExternalIds).toEqual(['1000:2', '1000:3']);
    expect(err.message).toContain('1000');
  });
});
