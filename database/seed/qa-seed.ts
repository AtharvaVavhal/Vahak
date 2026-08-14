/**
 * QA seed runner.
 *
 * Boots the real Nest application context and drives every consignment
 * through the ACTUAL ConsignmentsService/AuthService transition methods
 * (not hand-written status/event/hash inserts), so the data this produces
 * is indistinguishable in shape from what the running app itself creates —
 * including the DeliveryProof codeHash, which is computed by the real
 * sha256(pin:nonce) call inside ConsignmentsService.initiateHandover().
 *
 * Usage (from services/api/):
 *   ALLOW_QA_SEED=true npm run qa:seed
 *
 * Idempotency:
 *   Users/route/halts/bus are upserted by their natural unique keys (phone,
 *   route name, (routeId,sequence), registration) and safely reusable.
 *   Consignments are NOT individually idempotent — trackingCode is
 *   generated server-side from Date.now()+random and cannot be predicted
 *   or checked in advance. Instead, the whole lifecycle-fixture batch is
 *   skipped if the QA sender already has any consignments. Run qa:reset
 *   first to regenerate a clean batch.
 */
import { config as loadEnv } from 'dotenv';
import { findRepoRootEnvFile } from './find-env';

loadEnv({ path: findRepoRootEnvFile(__dirname) });

if (process.env.NODE_ENV === 'production') {
  console.error('[qa-seed] Refusing to run: NODE_ENV=production.');
  process.exit(1);
}

if (process.env.ALLOW_QA_SEED !== 'true') {
  console.error(
    '[qa-seed] Refusing to run: set ALLOW_QA_SEED=true to confirm this targets a development database.',
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('[qa-seed] Refusing to run: DATABASE_URL is not configured.');
  process.exit(1);
}

import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import type { Halt } from '../../services/api/src/generated/prisma/client';
import { AppModule } from '../../services/api/src/app.module';
import { PrismaService } from '../../services/api/src/shared/prisma/prisma.service';
import { AuthService } from '../../services/api/src/auth/auth.service';
import { RoutesService } from '../../services/api/src/routes/routes.service';
import { HaltsService } from '../../services/api/src/routes/halts.service';
import { BusesService } from '../../services/api/src/routes/buses.service';
import { ConsignmentsService } from '../../services/api/src/consignments/consignments.service';
import {
  QA_USERS,
  QA_ROUTE,
  QA_HALTS,
  QA_BUS,
  QA_CONSIGNMENT_FIXTURES,
  QaUserFixture,
} from './fixtures';

const QA_PASSWORD = process.env.QA_SEED_PASSWORD || 'QaSeed@2026';
const QA_ADMIN_PASSWORD = process.env.QA_SEED_ADMIN_PASSWORD || QA_PASSWORD;
const BCRYPT_COST = 12; // must match AuthService/seed-admin.ts

async function ensureAdmin(prisma: PrismaService, fixture: QaUserFixture) {
  const existing = await prisma.user.findUnique({ where: { phone: fixture.phone } });
  if (existing) return { user: existing, created: false };

  const passwordHash = await bcrypt.hash(QA_ADMIN_PASSWORD, BCRYPT_COST);
  const user = await prisma.user.create({
    data: {
      name: fixture.name,
      phone: fixture.phone,
      email: fixture.email,
      passwordHash,
      role: 'ADMIN',
    },
  });
  return { user, created: true };
}

async function ensureNonAdminUser(
  prisma: PrismaService,
  authService: AuthService,
  fixture: QaUserFixture & { role: 'SENDER' | 'CONDUCTOR' | 'RECIPIENT' },
) {
  const existing = await prisma.user.findUnique({ where: { phone: fixture.phone } });
  if (existing) return { user: existing, created: false };

  try {
    const result = await authService.register({
      name: fixture.name,
      phone: fixture.phone,
      email: fixture.email,
      password: QA_PASSWORD,
      role: fixture.role,
    });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: result.user.id } });
    return { user, created: true };
  } catch (err) {
    // Defensive: another process may have created it between our check and register().
    const existingAfterRace = await prisma.user.findUnique({ where: { phone: fixture.phone } });
    if (existingAfterRace) return { user: existingAfterRace, created: false };
    throw err;
  }
}

// QA fixtures are synthetic, not sourced from anywhere external, so they are
// explicitly labeled SIMULATED here rather than relying solely on the schema
// default. RoutesService/HaltsService/BusesService are left untouched — the
// label is applied as a direct follow-up update, not by changing what those
// services accept or how they behave.

async function ensureRoute(prisma: PrismaService, routesService: RoutesService) {
  const existing = await prisma.route.findFirst({ where: { name: QA_ROUTE.name } });
  if (existing) return { route: existing, created: false };
  const created = await routesService.create(QA_ROUTE);
  const route = await prisma.route.update({
    where: { id: created.id },
    data: { dataSource: 'SIMULATED' },
  });
  return { route, created: true };
}

async function ensureHalts(prisma: PrismaService, haltsService: HaltsService, routeId: string) {
  const halts: Halt[] = [];
  for (const haltFixture of QA_HALTS) {
    const existing = await prisma.halt.findFirst({
      where: { routeId, sequence: haltFixture.sequence },
    });
    if (existing) {
      halts.push(existing);
      continue;
    }
    const created = await haltsService.create(routeId, haltFixture);
    const halt = await prisma.halt.update({
      where: { id: created.id },
      data: { dataSource: 'SIMULATED' },
    });
    halts.push(halt);
  }
  return halts;
}

async function ensureBus(prisma: PrismaService, busesService: BusesService, routeId: string) {
  const existing = await prisma.bus.findUnique({ where: { registration: QA_BUS.registration } });
  if (existing) return { bus: existing, created: false };
  const created = await busesService.create(routeId, QA_BUS);
  const bus = await prisma.bus.update({
    where: { id: created.id },
    data: { dataSource: 'SIMULATED' },
  });
  return { bus, created: true };
}

interface LifecycleIds {
  sender: { id: string };
  recipient: { id: string };
  conductor: { id: string };
  route: { id: string };
  bus: { id: string };
  pickupHaltId: string;
  dropoffHaltId: string;
}

interface LifecycleResult {
  key: string;
  trackingCode: string;
  status: string;
  pin?: string;
  pinNote?: string;
}

async function createLifecycleConsignment(
  consignmentsService: ConsignmentsService,
  prisma: PrismaService,
  ids: LifecycleIds,
  fixture: (typeof QA_CONSIGNMENT_FIXTURES)[number],
): Promise<LifecycleResult> {
  const created = await consignmentsService.create(ids.sender.id, {
    recipientId: ids.recipient.id,
    routeId: ids.route.id,
    pickupHaltId: ids.pickupHaltId,
    dropoffHaltId: ids.dropoffHaltId,
    busId: ids.bus.id,
    parcelSize: fixture.parcelSize,
    description: fixture.description,
    fare: fixture.fare,
  });

  if (fixture.targetLifecycle === 'CREATED') {
    return { key: fixture.key, trackingCode: created.trackingCode, status: created.status };
  }

  const booked = await consignmentsService.book(created.id, ids.sender.id);

  if (fixture.targetLifecycle === 'BOOKED') {
    return { key: fixture.key, trackingCode: booked.trackingCode, status: booked.status };
  }

  if (fixture.targetLifecycle === 'CANCELLED') {
    const cancelled = await consignmentsService.cancel(created.id, ids.sender.id);
    return { key: fixture.key, trackingCode: cancelled.trackingCode, status: cancelled.status };
  }

  const accepted = await consignmentsService.accept(created.id, ids.conductor.id);

  if (fixture.targetLifecycle === 'ACCEPTED') {
    return { key: fixture.key, trackingCode: accepted.trackingCode, status: accepted.status };
  }

  const handover = await consignmentsService.initiateHandover(created.id, ids.conductor.id);

  if (fixture.targetLifecycle === 'IN_TRANSIT_ACTIVE') {
    return {
      key: fixture.key,
      trackingCode: handover.trackingCode,
      status: handover.status,
      pin: handover.handoverPin,
      pinNote: 'valid, unverified — use to manually test the handover/verify endpoint',
    };
  }

  if (fixture.targetLifecycle === 'IN_TRANSIT_EXPIRED_PIN') {
    // The real service always sets a 30-minute expiry with no override hook.
    // We backdate expiresAt on the already-correctly-generated proof so the
    // failure path is reachable immediately; codeHash/nonce are untouched.
    await prisma.deliveryProof.update({
      where: { consignmentId: created.id },
      data: { expiresAt: new Date(Date.now() - 60 * 1000) },
    });
    return {
      key: fixture.key,
      trackingCode: handover.trackingCode,
      status: handover.status,
      pin: handover.handoverPin,
      pinNote: 'intentionally expired — verify should fail with "Handover PIN has expired"',
    };
  }

  if (fixture.targetLifecycle === 'IN_TRANSIT_MAX_ATTEMPTS') {
    await prisma.deliveryProof.update({
      where: { consignmentId: created.id },
      data: { attempts: 5 },
    });
    return {
      key: fixture.key,
      trackingCode: handover.trackingCode,
      status: handover.status,
      pin: handover.handoverPin,
      pinNote:
        'attempts already at max — verify should fail with "Maximum PIN verification attempts exceeded"',
    };
  }

  // DELIVERED
  const verified = await consignmentsService.verifyHandover(
    created.id,
    ids.recipient.id,
    handover.handoverPin,
  );
  return {
    key: fixture.key,
    trackingCode: verified.consignment.trackingCode,
    status: verified.consignment.status,
    pin: handover.handoverPin,
    pinNote: 'already verified as part of seeding',
  };
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  try {
    const prisma = app.get(PrismaService);
    const authService = app.get(AuthService);
    const routesService = app.get(RoutesService);
    const haltsService = app.get(HaltsService);
    const busesService = app.get(BusesService);
    const consignmentsService = app.get(ConsignmentsService);

    const userResults = new Map<string, { id: string; created: boolean }>();
    for (const fixture of QA_USERS) {
      if (fixture.role === 'ADMIN') {
        const { user, created } = await ensureAdmin(prisma, fixture);
        userResults.set(fixture.key, { id: user.id, created });
      } else {
        const { user, created } = await ensureNonAdminUser(
          prisma,
          authService,
          fixture as QaUserFixture & { role: 'SENDER' | 'CONDUCTOR' | 'RECIPIENT' },
        );
        userResults.set(fixture.key, { id: user.id, created });
      }
    }

    const { route, created: routeCreated } = await ensureRoute(prisma, routesService);
    const halts = await ensureHalts(prisma, haltsService, route.id);
    const { bus, created: busCreated } = await ensureBus(prisma, busesService, route.id);

    const sender = userResults.get('sender')!;
    const conductor = userResults.get('conductor')!;
    const recipient = userResults.get('recipient')!;

    const existingConsignmentCount = await prisma.consignment.count({
      where: { senderId: sender.id },
    });

    const lifecycleResults: LifecycleResult[] = [];
    if (existingConsignmentCount > 0) {
      console.log(
        `\n[qa-seed] QA sender already has ${existingConsignmentCount} consignment(s) — skipping lifecycle fixture creation. Run qa:reset first to regenerate.`,
      );
    } else {
      const ids: LifecycleIds = {
        sender: { id: sender.id },
        recipient: { id: recipient.id },
        conductor: { id: conductor.id },
        route: { id: route.id },
        bus: { id: bus.id },
        pickupHaltId: halts[0].id,
        dropoffHaltId: halts[halts.length - 1].id,
      };
      for (const fixture of QA_CONSIGNMENT_FIXTURES) {
        const result = await createLifecycleConsignment(consignmentsService, prisma, ids, fixture);
        lifecycleResults.push(result);
      }
    }

    // ---- Summary output ----
    console.log('\n================ QA SEED SUMMARY ================');
    console.log(`Route: ${route.name}${routeCreated ? ' (created)' : ' (existing)'}`);
    console.log(`Bus:   ${bus.registration}${busCreated ? ' (created)' : ' (existing)'}`);
    console.log(`Halts: ${halts.map((h) => `${h.sequence}:${h.name}`).join(' -> ')}`);

    console.log('\n--- QA credentials (development/test only) ---');
    for (const fixture of QA_USERS) {
      const result = userResults.get(fixture.key)!;
      const password = fixture.role === 'ADMIN' ? QA_ADMIN_PASSWORD : QA_PASSWORD;
      console.log(
        `${fixture.role.padEnd(9)} phone=${fixture.phone}  email=${fixture.email}  password=${password}  ${result.created ? '(created)' : '(existing)'}`,
      );
    }

    if (lifecycleResults.length > 0) {
      console.log('\n--- Consignment lifecycle fixtures ---');
      for (const result of lifecycleResults) {
        const pinPart = result.pin ? `  PIN=${result.pin}  (${result.pinNote})` : '';
        console.log(
          `${result.key.padEnd(22)} trackingCode=${result.trackingCode}  status=${result.status}${pinPart}`,
        );
      }
    }
    console.log('===================================================\n');
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('[qa-seed] Failed:', err);
  process.exit(1);
});
