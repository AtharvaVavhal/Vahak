/**
 * Write-path logic for OSM ingestion: dry-run planning and real writes,
 * including safe pruning of stale OSM-sourced halts.
 *
 * Kept separate from osm-import.ts (which owns the env-loading guard checks
 * and Prisma client construction) so this logic is importable and unit
 * testable without triggering those guards — the same pure-logic/guarded-
 * entry-point split already used between normalize.ts and osm-import.ts.
 */
import type { PrismaClient, Prisma } from '../../services/api/src/generated/prisma/client';
import { OSM_PROVIDER } from './relations';
import type { NormalizedRoute, NormalizedHalt } from './normalize';

export interface ExistingOsmHalt {
  id: string;
  externalId: string | null;
}

/**
 * Existing OSM halts for a route whose externalId is absent from the
 * freshly fetched, validated halt list — i.e. no longer present in the
 * upstream OSM relation as of this fetch. Pure comparison, no I/O: callers
 * are responsible for scoping `existingOsmHalts` to the correct route and
 * provider before calling this.
 */
export function computeStaleHalts(
  freshHalts: NormalizedHalt[],
  existingOsmHalts: ExistingOsmHalt[],
): ExistingOsmHalt[] {
  const freshIds = new Set(freshHalts.map((h) => h.externalId));
  return existingOsmHalts.filter((h) => h.externalId !== null && !freshIds.has(h.externalId));
}

/**
 * Thrown when a stale OSM halt that would otherwise be pruned is still
 * referenced by a real Consignment. The entire relation's write (route +
 * halt upserts, in the same transaction) is rolled back rather than
 * deleting a halt something else depends on.
 */
export class StaleHaltReferencedError extends Error {
  constructor(
    public readonly relationId: string,
    public readonly consignmentCount: number,
    public readonly haltExternalIds: string[],
  ) {
    super(
      `Relation ${relationId}: ${consignmentCount} consignment(s) reference stale halt(s) that ` +
        `would be pruned (${haltExternalIds.join(', ')}). Aborting this relation's update — no ` +
        `changes were made for it.`,
    );
    this.name = 'StaleHaltReferencedError';
  }
}

export interface WritePlanItem {
  route: NormalizedRoute;
  routeExists: boolean;
  haltsToCreate: number;
  haltsToUpdate: number;
  haltsToPrune: number;
  haltsPruneBlockedByConsignment: number;
}

export async function planWrites(
  prisma: PrismaClient,
  routes: NormalizedRoute[],
): Promise<WritePlanItem[]> {
  const plan: WritePlanItem[] = [];
  for (const route of routes) {
    const existingRoute = await prisma.route.findUnique({
      where: { provider_externalId: { provider: OSM_PROVIDER, externalId: route.externalId } },
    });

    let haltsToCreate = 0;
    let haltsToUpdate = 0;
    for (const halt of route.halts) {
      const existingHalt = await prisma.halt.findUnique({
        where: { provider_externalId: { provider: OSM_PROVIDER, externalId: halt.externalId } },
      });
      if (existingHalt) haltsToUpdate += 1;
      else haltsToCreate += 1;
    }

    let haltsToPrune = 0;
    let haltsPruneBlockedByConsignment = 0;
    if (existingRoute) {
      const existingOsmHalts = await prisma.halt.findMany({
        where: { routeId: existingRoute.id, provider: OSM_PROVIDER },
        select: { id: true, externalId: true },
      });
      const stale = computeStaleHalts(route.halts, existingOsmHalts);
      haltsToPrune = stale.length;
      if (stale.length > 0) {
        const staleIds = stale.map((h) => h.id);
        haltsPruneBlockedByConsignment = await prisma.consignment.count({
          where: { OR: [{ pickupHaltId: { in: staleIds } }, { dropoffHaltId: { in: staleIds } }] },
        });
      }
    }

    plan.push({
      route,
      routeExists: !!existingRoute,
      haltsToCreate,
      haltsToUpdate,
      haltsToPrune,
      haltsPruneBlockedByConsignment,
    });
  }
  return plan;
}

export interface WriteResult {
  route: NormalizedRoute;
  status: 'written' | 'aborted';
  prunedCount: number;
  abortReason?: string;
}

/**
 * Writes every route in `plan`. Only ever called with routes that already
 * passed full validation (see osm-import.ts's `main`) — a rejected or
 * fetch-failed relation never produces a NormalizedRoute, so it can never
 * reach this function or be pruned against.
 *
 * Each route's route-upsert + halt-upserts + stale-halt-prune run inside a
 * single transaction, so a consignment-referenced stale halt aborts that
 * route's entire update (rolled back, no partial state) without affecting
 * any other route in the batch.
 */
export async function executeWrites(
  prisma: PrismaClient,
  plan: WritePlanItem[],
  fetchedAt: Date,
): Promise<WriteResult[]> {
  const results: WriteResult[] = [];

  for (const { route } of plan) {
    try {
      const prunedCount = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const routeRow = await tx.route.upsert({
          where: { provider_externalId: { provider: OSM_PROVIDER, externalId: route.externalId } },
          create: {
            name: route.name,
            origin: route.origin,
            destination: route.destination,
            routeRef: route.routeRef,
            direction: route.direction,
            dataSource: 'COMMUNITY_DERIVED',
            provider: OSM_PROVIDER,
            externalId: route.externalId,
            sourceUrl: route.sourceUrl,
            fetchedAt,
          },
          update: {
            name: route.name,
            origin: route.origin,
            destination: route.destination,
            routeRef: route.routeRef,
            direction: route.direction,
            dataSource: 'COMMUNITY_DERIVED',
            sourceUrl: route.sourceUrl,
            fetchedAt,
          },
        });

        for (const halt of route.halts) {
          await tx.halt.upsert({
            where: { provider_externalId: { provider: OSM_PROVIDER, externalId: halt.externalId } },
            create: {
              name: halt.name,
              sequence: halt.sequence,
              latitude: halt.latitude,
              longitude: halt.longitude,
              dataSource: 'COMMUNITY_DERIVED',
              provider: OSM_PROVIDER,
              externalId: halt.externalId,
              sourceUrl: halt.sourceUrl,
              fetchedAt,
              route: { connect: { id: routeRow.id } },
            },
            update: {
              name: halt.name,
              sequence: halt.sequence,
              latitude: halt.latitude,
              longitude: halt.longitude,
              dataSource: 'COMMUNITY_DERIVED',
              sourceUrl: halt.sourceUrl,
              fetchedAt,
              route: { connect: { id: routeRow.id } },
            },
          });
        }

        // Prune only: rows for THIS route, provider="osm" — never SIMULATED,
        // never any other provider, never any other route.
        const existingOsmHalts = await tx.halt.findMany({
          where: { routeId: routeRow.id, provider: OSM_PROVIDER },
          select: { id: true, externalId: true },
        });
        const stale = computeStaleHalts(route.halts, existingOsmHalts);
        if (stale.length === 0) return 0;

        const staleIds = stale.map((h) => h.id);
        const dependentCount = await tx.consignment.count({
          where: { OR: [{ pickupHaltId: { in: staleIds } }, { dropoffHaltId: { in: staleIds } }] },
        });
        if (dependentCount > 0) {
          throw new StaleHaltReferencedError(
            route.externalId,
            dependentCount,
            stale.map((h) => h.externalId!),
          );
        }

        await tx.halt.deleteMany({ where: { id: { in: staleIds } } });
        return stale.length;
      });

      results.push({ route, status: 'written', prunedCount });
    } catch (err) {
      if (err instanceof StaleHaltReferencedError) {
        results.push({ route, status: 'aborted', prunedCount: 0, abortReason: err.message });
        continue;
      }
      throw err;
    }
  }

  return results;
}

export function printSummary(
  label: string,
  outcomes: Array<{
    relationId: string;
    rejection: { reason: string; detail: string } | null;
    fetchFailed: boolean;
  }>,
  approvedCount: number,
  plan: WritePlanItem[],
  writeResults: WriteResult[],
  written: boolean,
): void {
  const discovered = outcomes.filter((o) => !o.fetchFailed).length;
  const skipped = outcomes.filter((o) => o.fetchFailed).length;
  const rejected = outcomes.filter((o) => !o.fetchFailed && o.rejection).length;
  const routesToCreate = plan.filter((p) => !p.routeExists).length;
  const routesToUpdate = plan.filter((p) => p.routeExists).length;
  const stopsToCreate = plan.reduce((sum, p) => sum + p.haltsToCreate, 0);
  const stopsToUpdate = plan.reduce((sum, p) => sum + p.haltsToUpdate, 0);
  const invalidStops = plan.reduce((sum, p) => sum + p.route.skippedWayPlatformCount, 0);
  const stopsToPrune = plan.reduce((sum, p) => sum + p.haltsToPrune, 0);
  const pruneBlocked = plan.reduce((sum, p) => sum + p.haltsPruneBlockedByConsignment, 0);
  const aborted = writeResults.filter((r) => r.status === 'aborted').length;

  console.log(`\n${label}\n`);
  console.log(`Relations discovered: ${discovered}`);
  console.log(`Approved relations: ${approvedCount}`);
  console.log(`Skipped relations: ${skipped}`);
  console.log(`Routes to create: ${routesToCreate}`);
  console.log(`Routes to update: ${routesToUpdate}`);
  console.log(`Stops to create: ${stopsToCreate}`);
  console.log(`Stops to update: ${stopsToUpdate}`);
  console.log(`Stops to prune (stale, no longer in upstream relation): ${stopsToPrune}`);
  if (pruneBlocked > 0) {
    console.log(
      `Stale stops blocked by a referencing Consignment (would abort that relation): ${pruneBlocked}`,
    );
  }
  console.log(`Invalid stops (way-typed platform members skipped): ${invalidStops}`);
  console.log(`Rejected relations: ${rejected}`);
  if (aborted > 0) {
    console.log(`Aborted relations (stale halt referenced by a Consignment): ${aborted}`);
  }

  if (rejected > 0 || skipped > 0) {
    console.log('\n--- Skipped / rejected relations ---');
    for (const outcome of outcomes) {
      if (outcome.rejection) {
        console.log(
          `  ${outcome.relationId}  [${outcome.rejection.reason}]  ${outcome.rejection.detail}`,
        );
      }
    }
  }

  if (aborted > 0) {
    console.log('\n--- Aborted relations ---');
    for (const result of writeResults) {
      if (result.status === 'aborted') {
        console.log(`  ${result.route.externalId}  ${result.abortReason}`);
      }
    }
  }

  if (plan.length > 0) {
    console.log('\n--- Accepted routes ---');
    for (const { route, routeExists, haltsToCreate, haltsToUpdate, haltsToPrune } of plan) {
      console.log(
        `  ${route.routeRef.padEnd(6)} relation=${route.externalId}  "${route.name}"  ` +
          `${routeExists ? '(update)' : '(create)'}  stops=${route.halts.length} ` +
          `(create=${haltsToCreate} update=${haltsToUpdate} prune=${haltsToPrune})  ` +
          `direction=${route.direction ?? 'null'}  skippedWayPlatforms=${route.skippedWayPlatformCount}`,
      );
    }
  }

  console.log(
    written
      ? '\nCommunity-derived OpenStreetMap PMPML route data has been written.\n'
      : '\nDRY RUN — no database writes were performed.\n',
  );
}
