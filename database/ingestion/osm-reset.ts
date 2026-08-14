/**
 * OSM ingestion reset — deletes ONLY rows created by osm-import.ts.
 *
 * Completely independent from qa-reset.ts: different scope (provider="osm"
 * + dataSource="COMMUNITY_DERIVED" vs QA's reserved phone/route-name/bus-
 * registration values), different code path, no shared logic. Neither
 * script can affect the other's data.
 *
 * Usage (from services/api/):
 *   ALLOW_REAL_DATA_INGEST=true npm run osm:ingest:reset
 */
import { config as loadEnv } from 'dotenv';
import { findRepoRootEnvFile } from './find-env';

loadEnv({ path: findRepoRootEnvFile(__dirname) });

if (process.env.NODE_ENV === 'production') {
  console.error('[osm-reset] Refusing to run: NODE_ENV=production.');
  process.exit(1);
}

if (process.env.ALLOW_REAL_DATA_INGEST !== 'true') {
  console.error(
    '[osm-reset] Refusing to run: set ALLOW_REAL_DATA_INGEST=true to confirm this targets a development database.',
  );
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('[osm-reset] Refusing to run: DATABASE_URL is not configured.');
  process.exit(1);
}

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../services/api/src/generated/prisma/client';
import { OSM_PROVIDER } from './relations';

const OSM_SCOPE = { provider: OSM_PROVIDER, dataSource: 'COMMUNITY_DERIVED' as const };

async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: connectionString! });
  const prisma = new PrismaClient({ adapter });

  try {
    const osmRoutes = await prisma.route.findMany({ where: OSM_SCOPE, select: { id: true } });
    const osmHalts = await prisma.halt.findMany({ where: OSM_SCOPE, select: { id: true } });
    const osmRouteIds = osmRoutes.map((r) => r.id);
    const osmHaltIds = osmHalts.map((h) => h.id);

    if (osmRouteIds.length === 0 && osmHaltIds.length === 0) {
      console.log('\n[osm-reset] Nothing to reset — no OSM-sourced rows found.\n');
      return;
    }

    // Before deleting anything, verify no production-domain record depends
    // on this data. Fail safely and loudly rather than deleting real
    // consignments/buses or hitting an opaque Prisma FK error mid-delete.
    const [dependentConsignmentsByRoute, dependentConsignmentsByHalt, dependentBuses] =
      await Promise.all([
        prisma.consignment.count({ where: { routeId: { in: osmRouteIds } } }),
        prisma.consignment.count({
          where: {
            OR: [{ pickupHaltId: { in: osmHaltIds } }, { dropoffHaltId: { in: osmHaltIds } }],
          },
        }),
        prisma.bus.count({ where: { routeId: { in: osmRouteIds } } }),
      ]);

    const totalDependents =
      dependentConsignmentsByRoute + dependentConsignmentsByHalt + dependentBuses;
    if (totalDependents > 0) {
      console.error(
        `\n[osm-reset] Refusing to reset: ${dependentConsignmentsByRoute} consignment(s) reference an OSM route, ` +
          `${dependentConsignmentsByHalt} consignment(s) reference an OSM halt, and ${dependentBuses} bus(es) ` +
          `reference an OSM route. Remove those records first, or investigate why production-domain data ` +
          `depends on pilot ingestion data before resetting.\n`,
      );
      process.exit(1);
    }

    const [deletedHalts, deletedRoutes] = await prisma.$transaction([
      prisma.halt.deleteMany({ where: OSM_SCOPE }),
      prisma.route.deleteMany({ where: OSM_SCOPE }),
    ]);

    console.log('\n================ OSM RESET SUMMARY ================');
    console.log(`Halt rows deleted:  ${deletedHalts.count}`);
    console.log(`Route rows deleted: ${deletedRoutes.count}`);
    console.log('=====================================================\n');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[osm-reset] Failed:', err);
  process.exit(1);
});
