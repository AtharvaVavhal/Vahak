/**
 * QA reset runner.
 *
 * Deletes ONLY rows that belong to the fixed QA dataset defined in
 * fixtures.ts (the reserved QA phone numbers, the QA route name, and the
 * QA bus registration). It never truncates a table and never touches rows
 * created by anything else in the development database.
 *
 * Usage (from services/api/):
 *   ALLOW_QA_SEED=true npm run qa:reset
 */
import { config as loadEnv } from 'dotenv';
import { findRepoRootEnvFile } from './find-env';

loadEnv({ path: findRepoRootEnvFile(__dirname) });

if (process.env.NODE_ENV === 'production') {
  console.error('[qa-reset] Refusing to run: NODE_ENV=production.');
  process.exit(1);
}

if (process.env.ALLOW_QA_SEED !== 'true') {
  console.error(
    '[qa-reset] Refusing to run: set ALLOW_QA_SEED=true to confirm this targets a development database.',
  );
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('[qa-reset] Refusing to run: DATABASE_URL is not configured.');
  process.exit(1);
}

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../services/api/src/generated/prisma/client';
import { QA_USERS, QA_ROUTE, QA_BUS } from './fixtures';

async function main() {
  const adapter = new PrismaPg({ connectionString: connectionString! });
  const prisma = new PrismaClient({ adapter });

  try {
    const qaPhones = QA_USERS.map((u) => u.phone);
    const qaUsers = await prisma.user.findMany({ where: { phone: { in: qaPhones } } });
    const qaUserIds = qaUsers.map((u) => u.id);

    const qaRoute = await prisma.route.findFirst({ where: { name: QA_ROUTE.name } });

    const consignmentScope = { senderId: { in: qaUserIds } };

    const [
      deliveryProofs,
      consignmentEvents,
      incentiveLedgers,
      consignments,
      buses,
      halts,
      routes,
      users,
    ] = await prisma.$transaction([
      prisma.deliveryProof.deleteMany({ where: { consignment: consignmentScope } }),
      prisma.consignmentEvent.deleteMany({
        where: { OR: [{ consignment: consignmentScope }, { actorId: { in: qaUserIds } }] },
      }),
      prisma.incentiveLedger.deleteMany({
        where: { OR: [{ userId: { in: qaUserIds } }, { consignment: consignmentScope }] },
      }),
      prisma.consignment.deleteMany({ where: consignmentScope }),
      prisma.bus.deleteMany({ where: { registration: QA_BUS.registration } }),
      prisma.halt.deleteMany({ where: qaRoute ? { routeId: qaRoute.id } : { id: '' } }),
      prisma.route.deleteMany({ where: { name: QA_ROUTE.name } }),
      prisma.user.deleteMany({ where: { phone: { in: qaPhones } } }),
    ]);

    console.log('\n================ QA RESET SUMMARY ================');
    console.log(`DeliveryProof rows deleted:      ${deliveryProofs.count}`);
    console.log(`ConsignmentEvent rows deleted:    ${consignmentEvents.count}`);
    console.log(`IncentiveLedger rows deleted:     ${incentiveLedgers.count}`);
    console.log(`Consignment rows deleted:         ${consignments.count}`);
    console.log(`Bus rows deleted:                 ${buses.count}`);
    console.log(`Halt rows deleted:                ${halts.count}`);
    console.log(`Route rows deleted:                ${routes.count}`);
    console.log(`User rows deleted:                ${users.count}`);
    console.log('====================================================\n');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[qa-reset] Failed:', err);
  process.exit(1);
});
