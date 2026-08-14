/**
 * PMPML OSM ingestion — imports ONLY the 14 approved relations listed in
 * relations.ts. See README.md for the full design rationale, especially
 * the composite Halt.externalId identity (required because real stops are
 * shared across routes) and the fail-safe, whole-relation validation model.
 *
 * Usage (from services/api/):
 *   DRY_RUN=true npm run osm:ingest                    # fetch/validate/normalize only, zero writes
 *   ALLOW_REAL_DATA_INGEST=true npm run osm:ingest      # real import
 *
 * This is COMMUNITY_DERIVED OpenStreetMap data, not official PMPML data.
 */
import { config as loadEnv } from 'dotenv';
import { findRepoRootEnvFile } from './find-env';

loadEnv({ path: findRepoRootEnvFile(__dirname) });

const DRY_RUN = process.env.DRY_RUN === 'true';

if (process.env.NODE_ENV === 'production') {
  console.error('[osm-import] Refusing to run: NODE_ENV=production.');
  process.exit(1);
}

if (!DRY_RUN && process.env.ALLOW_REAL_DATA_INGEST !== 'true') {
  console.error(
    '[osm-import] Refusing to run: set ALLOW_REAL_DATA_INGEST=true to confirm a real write, or DRY_RUN=true to inspect without writing.',
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('[osm-import] Refusing to run: DATABASE_URL is not configured.');
  process.exit(1);
}

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../services/api/src/generated/prisma/client';
import { APPROVED_PMPML_RELATIONS } from './relations';
import { fetchRelation, fetchNodes, politeDelay } from './overpass';
import {
  normalizeRelation,
  findDuplicateExternalIds,
  type NormalizedRoute,
  type RejectedRelation,
} from './normalize';
import { planWrites, executeWrites, printSummary } from './osm-write';

const STOP_ROLES = new Set([
  'stop',
  'platform',
  'stop_entry_only',
  'stop_exit_only',
  'platform_entry_only',
  'platform_exit_only',
]);

interface FetchOutcome {
  relationId: string;
  normalized: NormalizedRoute | null;
  rejection: RejectedRelation | null;
  fetchFailed: boolean;
}

async function fetchAndNormalizeAll(): Promise<FetchOutcome[]> {
  const outcomes: FetchOutcome[] = [];
  const total = APPROVED_PMPML_RELATIONS.length;

  let index = 0;
  for (const { relationId, routeRef } of APPROVED_PMPML_RELATIONS) {
    index += 1;
    console.log(
      `[osm-import] Fetching relation ${relationId} (route ${routeRef}) — ${index}/${total}...`,
    );
    try {
      const relation = await fetchRelation(relationId);

      if (!relation) {
        outcomes.push({
          relationId,
          normalized: null,
          rejection: {
            relationId,
            reason: 'RELATION_NOT_FOUND',
            detail: 'Not returned by Overpass',
          },
          fetchFailed: true,
        });
        await politeDelay();
        continue;
      }

      const stopNodeIds = relation.members
        .filter((m) => m.type === 'node' && STOP_ROLES.has(m.role))
        .map((m) => String(m.ref));

      const resolvedNodes = await fetchNodes(stopNodeIds);
      const result = normalizeRelation(relationId, relation, resolvedNodes);

      if (result.ok) {
        console.log(`  -> accepted: ${result.route.halts.length} stops`);
        outcomes.push({
          relationId,
          normalized: result.route,
          rejection: null,
          fetchFailed: false,
        });
      } else {
        console.log(`  -> rejected: ${result.rejection.reason} (${result.rejection.detail})`);
        outcomes.push({
          relationId,
          normalized: null,
          rejection: result.rejection,
          fetchFailed: false,
        });
      }
    } catch (err) {
      // Network/Overpass failure after retries — a fetch failure, not a validation rejection.
      const message = err instanceof Error ? err.message : String(err);
      console.log(`  -> fetch failed: ${message}`);
      outcomes.push({
        relationId,
        normalized: null,
        rejection: {
          relationId,
          reason: 'RELATION_NOT_FOUND',
          detail: `Fetch failed: ${message}`,
        },
        fetchFailed: true,
      });
    }

    await politeDelay();
  }

  return outcomes;
}

async function main(): Promise<void> {
  const fetchedAt = new Date();
  const outcomes = await fetchAndNormalizeAll();
  const acceptedRoutes = outcomes.map((o) => o.normalized).filter((r): r is NormalizedRoute => !!r);

  const duplicates = findDuplicateExternalIds(acceptedRoutes);
  if (duplicates.length > 0) {
    console.error(
      `[osm-import] Aborting entire batch: duplicate external IDs found across the import batch: ${duplicates.join(', ')}`,
    );
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const plan = await planWrites(prisma, acceptedRoutes);

    const writeResults = DRY_RUN ? [] : await executeWrites(prisma, plan, fetchedAt);

    printSummary(
      DRY_RUN ? 'PMPML OSM ingestion dry run' : 'PMPML OSM ingestion',
      outcomes,
      APPROVED_PMPML_RELATIONS.length,
      plan,
      writeResults,
      !DRY_RUN,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[osm-import] Failed:', err);
  process.exit(1);
});
