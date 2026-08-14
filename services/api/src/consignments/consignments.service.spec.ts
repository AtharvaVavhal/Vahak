import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConsignmentsService } from './consignments.service';
import { PrismaService } from '../shared/prisma/prisma.service';
import type { CreateConsignmentDto } from './dto/create-consignment.dto';

describe('ConsignmentsService#findById (authorization)', () => {
  let service: ConsignmentsService;

  const mockPrismaService = {
    consignment: {
      findUnique: jest.fn(),
    },
  };

  const baseConsignment = {
    id: 'consignment-1',
    senderId: 'sender-1',
    recipientId: 'recipient-1',
    conductorId: null as string | null,
    status: 'CREATED',
    // Shaped to exactly match the "public" (provenance-stripped) field set,
    // so these fixtures pass unchanged through stripConsignmentProvenance —
    // keeping the toEqual/toMatchObject assertions below valid for both
    // ADMIN (untouched) and non-ADMIN (stripped) responses. Provenance-field
    // handling itself is covered separately below.
    route: {
      id: 'route-1',
      name: 'Route 1',
      origin: 'A',
      destination: 'B',
      routeRef: null as string | null,
      direction: null as string | null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    pickupHalt: {
      id: 'halt-pickup',
      routeId: 'route-1',
      name: 'Pickup Halt',
      sequence: 1,
      latitude: null as number | null,
      longitude: null as number | null,
    },
    dropoffHalt: {
      id: 'halt-dropoff',
      routeId: 'route-1',
      name: 'Dropoff Halt',
      sequence: 2,
      latitude: null as number | null,
      longitude: null as number | null,
    },
    bus: null as null | { id: string; registration: string; routeId: string; active: boolean },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsignmentsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ConsignmentsService>(ConsignmentsService);
  });

  it('allows an admin to access an arbitrary consignment', async () => {
    mockPrismaService.consignment.findUnique.mockResolvedValue(baseConsignment);

    await expect(
      service.findById('consignment-1', { id: 'admin-1', role: 'ADMIN' }),
    ).resolves.toEqual(baseConsignment);
  });

  it('allows a sender to access their own consignment', async () => {
    mockPrismaService.consignment.findUnique.mockResolvedValue(baseConsignment);

    await expect(
      service.findById('consignment-1', { id: 'sender-1', role: 'SENDER' }),
    ).resolves.toEqual(baseConsignment);
  });

  it('blocks a sender from accessing an unrelated consignment', async () => {
    mockPrismaService.consignment.findUnique.mockResolvedValue(baseConsignment);

    await expect(
      service.findById('consignment-1', { id: 'other-sender', role: 'SENDER' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows a recipient to access their own delivery', async () => {
    mockPrismaService.consignment.findUnique.mockResolvedValue(baseConsignment);

    await expect(
      service.findById('consignment-1', { id: 'recipient-1', role: 'RECIPIENT' }),
    ).resolves.toEqual(baseConsignment);
  });

  it('blocks a recipient from accessing an unrelated consignment', async () => {
    mockPrismaService.consignment.findUnique.mockResolvedValue(baseConsignment);

    await expect(
      service.findById('consignment-1', { id: 'other-recipient', role: 'RECIPIENT' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows a conductor to access a BOOKED consignment they have not yet accepted', async () => {
    mockPrismaService.consignment.findUnique.mockResolvedValue({
      ...baseConsignment,
      status: 'BOOKED',
      conductorId: null,
    });

    await expect(
      service.findById('consignment-1', { id: 'conductor-1', role: 'CONDUCTOR' }),
    ).resolves.toMatchObject({ status: 'BOOKED' });
  });

  it('allows a conductor to access their own accepted consignment', async () => {
    mockPrismaService.consignment.findUnique.mockResolvedValue({
      ...baseConsignment,
      status: 'ACCEPTED',
      conductorId: 'conductor-1',
    });

    await expect(
      service.findById('consignment-1', { id: 'conductor-1', role: 'CONDUCTOR' }),
    ).resolves.toMatchObject({ conductorId: 'conductor-1' });
  });

  it('blocks a conductor from accessing an unrelated non-BOOKED consignment', async () => {
    mockPrismaService.consignment.findUnique.mockResolvedValue({
      ...baseConsignment,
      status: 'ACCEPTED',
      conductorId: 'someone-else',
    });

    await expect(
      service.findById('consignment-1', { id: 'conductor-1', role: 'CONDUCTOR' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns 404 for a missing consignment before any authorization check', async () => {
    mockPrismaService.consignment.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing-id', { id: 'admin-1', role: 'ADMIN' })).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('ConsignmentsService#findById (provenance isolation)', () => {
  let service: ConsignmentsService;

  const mockPrismaService = {
    consignment: {
      findUnique: jest.fn(),
    },
  };

  const consignmentWithProvenance = {
    id: 'consignment-1',
    senderId: 'sender-1',
    recipientId: 'recipient-1',
    conductorId: null as string | null,
    status: 'BOOKED',
    route: {
      id: 'route-1',
      name: 'Route 1',
      origin: 'A',
      destination: 'B',
      routeRef: null,
      direction: null,
      dataSource: 'COMMUNITY_DERIVED',
      provider: 'osm',
      externalId: 'ext-1',
      sourceUrl: 'https://example.com',
      fetchedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    pickupHalt: {
      id: 'halt-pickup',
      routeId: 'route-1',
      name: 'Pickup Halt',
      sequence: 1,
      latitude: null,
      longitude: null,
      dataSource: 'COMMUNITY_DERIVED',
      provider: 'osm',
      externalId: 'ext-2',
      sourceUrl: 'https://example.com',
      fetchedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    dropoffHalt: {
      id: 'halt-dropoff',
      routeId: 'route-1',
      name: 'Dropoff Halt',
      sequence: 2,
      latitude: null,
      longitude: null,
      dataSource: 'COMMUNITY_DERIVED',
      provider: 'osm',
      externalId: 'ext-3',
      sourceUrl: 'https://example.com',
      fetchedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    bus: {
      id: 'bus-1',
      registration: 'BUS-001',
      routeId: 'route-1',
      active: true,
      dataSource: 'COMMUNITY_DERIVED',
      provider: 'osm',
      externalId: 'ext-4',
      sourceUrl: 'https://example.com',
      fetchedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  };

  const PROVENANCE_KEYS = ['dataSource', 'provider', 'externalId', 'sourceUrl', 'fetchedAt'];

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsignmentsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ConsignmentsService>(ConsignmentsService);
    mockPrismaService.consignment.findUnique.mockResolvedValue(consignmentWithProvenance);
  });

  it('keeps provenance fields on route/halts/bus for ADMIN', async () => {
    const result = await service.findById('consignment-1', { id: 'admin-1', role: 'ADMIN' });

    for (const key of PROVENANCE_KEYS) {
      expect(result.route).toHaveProperty(key);
      expect(result.pickupHalt).toHaveProperty(key);
      expect(result.dropoffHalt).toHaveProperty(key);
      expect(result.bus).toHaveProperty(key);
    }
  });

  it('strips provenance fields from route/halts/bus for CONDUCTOR (BOOKED, unclaimed)', async () => {
    const result = await service.findById('consignment-1', {
      id: 'conductor-1',
      role: 'CONDUCTOR',
    });

    for (const key of PROVENANCE_KEYS) {
      expect(result.route).not.toHaveProperty(key);
      expect(result.pickupHalt).not.toHaveProperty(key);
      expect(result.dropoffHalt).not.toHaveProperty(key);
      expect(result.bus).not.toHaveProperty(key);
    }
    // Non-provenance fields must survive the strip.
    expect(result.route).toMatchObject({ id: 'route-1', name: 'Route 1' });
    expect(result.bus).toMatchObject({ id: 'bus-1', registration: 'BUS-001' });
  });

  it('strips provenance fields for SENDER', async () => {
    mockPrismaService.consignment.findUnique.mockResolvedValue({
      ...consignmentWithProvenance,
      conductorId: null,
    });

    const result = await service.findById('consignment-1', { id: 'sender-1', role: 'SENDER' });

    for (const key of PROVENANCE_KEYS) {
      expect(result.route).not.toHaveProperty(key);
    }
  });

  it('strips provenance fields for RECIPIENT', async () => {
    const result = await service.findById('consignment-1', {
      id: 'recipient-1',
      role: 'RECIPIENT',
    });

    for (const key of PROVENANCE_KEYS) {
      expect(result.route).not.toHaveProperty(key);
    }
  });

  it('leaves bus null as null (no provenance object to strip) for non-admin', async () => {
    mockPrismaService.consignment.findUnique.mockResolvedValue({
      ...consignmentWithProvenance,
      bus: null,
    });

    const result = await service.findById('consignment-1', { id: 'sender-1', role: 'SENDER' });

    expect(result.bus).toBeNull();
  });
});

describe('ConsignmentsService#create (route/halt integrity)', () => {
  let service: ConsignmentsService;

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
    route: { findUnique: jest.fn() },
    halt: { findUnique: jest.fn() },
    bus: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };

  const baseInput: CreateConsignmentDto = {
    recipientId: 'recipient-1',
    routeId: 'route-1',
    pickupHaltId: 'halt-pickup',
    dropoffHaltId: 'halt-dropoff',
    parcelSize: 'SMALL',
    fare: 50,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsignmentsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ConsignmentsService>(ConsignmentsService);

    mockPrismaService.user.findUnique.mockResolvedValue({ id: 'recipient-1' });
    mockPrismaService.route.findUnique.mockResolvedValue({ id: 'route-1' });
    mockPrismaService.$transaction.mockImplementation(
      async (
        callback: (tx: {
          consignment: { create: jest.Mock };
          consignmentEvent: { create: jest.Mock };
        }) => Promise<unknown>,
      ) =>
        callback({
          consignment: { create: jest.fn().mockResolvedValue({ id: 'consignment-1' }) },
          consignmentEvent: { create: jest.fn().mockResolvedValue({}) },
        }),
    );
  });

  it('A: accepts when the pickup halt belongs to the selected route', async () => {
    mockPrismaService.halt.findUnique
      .mockResolvedValueOnce({ id: 'halt-pickup', routeId: 'route-1' })
      .mockResolvedValueOnce({ id: 'halt-dropoff', routeId: 'route-1' });

    await expect(service.create('sender-1', baseInput)).resolves.toEqual({ id: 'consignment-1' });
  });

  it('B: accepts when the dropoff halt belongs to the selected route', async () => {
    mockPrismaService.halt.findUnique
      .mockResolvedValueOnce({ id: 'halt-pickup', routeId: 'route-1' })
      .mockResolvedValueOnce({ id: 'halt-dropoff', routeId: 'route-1' });

    await expect(service.create('sender-1', baseInput)).resolves.toEqual({ id: 'consignment-1' });
  });

  it('C: rejects when the pickup halt belongs to another route', async () => {
    mockPrismaService.halt.findUnique
      .mockResolvedValueOnce({ id: 'halt-pickup', routeId: 'other-route' })
      .mockResolvedValueOnce({ id: 'halt-dropoff', routeId: 'route-1' });

    await expect(service.create('sender-1', baseInput)).rejects.toThrow(BadRequestException);
    expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
  });

  it('D: rejects when the dropoff halt belongs to another route', async () => {
    mockPrismaService.halt.findUnique
      .mockResolvedValueOnce({ id: 'halt-pickup', routeId: 'route-1' })
      .mockResolvedValueOnce({ id: 'halt-dropoff', routeId: 'other-route' });

    await expect(service.create('sender-1', baseInput)).rejects.toThrow(BadRequestException);
    expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
  });

  it('E: rejects when both pickup and dropoff halts belong to another route', async () => {
    mockPrismaService.halt.findUnique
      .mockResolvedValueOnce({ id: 'halt-pickup', routeId: 'other-route' })
      .mockResolvedValueOnce({ id: 'halt-dropoff', routeId: 'other-route' });

    await expect(service.create('sender-1', baseInput)).rejects.toThrow(BadRequestException);
    expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
  });

  it('regression: still rejects when the recipient does not exist', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);

    await expect(service.create('sender-1', baseInput)).rejects.toThrow(NotFoundException);
  });

  it('regression: still rejects when the route does not exist', async () => {
    mockPrismaService.route.findUnique.mockResolvedValue(null);

    await expect(service.create('sender-1', baseInput)).rejects.toThrow(NotFoundException);
  });

  it('regression: still rejects when the pickup halt does not exist', async () => {
    mockPrismaService.halt.findUnique.mockResolvedValueOnce(null);

    await expect(service.create('sender-1', baseInput)).rejects.toThrow(NotFoundException);
  });

  it('regression: still rejects when the dropoff halt does not exist', async () => {
    mockPrismaService.halt.findUnique
      .mockResolvedValueOnce({ id: 'halt-pickup', routeId: 'route-1' })
      .mockResolvedValueOnce(null);

    await expect(service.create('sender-1', baseInput)).rejects.toThrow(NotFoundException);
  });
});

describe('ConsignmentsService#create (bus/route integrity)', () => {
  let service: ConsignmentsService;

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
    route: { findUnique: jest.fn() },
    halt: { findUnique: jest.fn() },
    bus: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };

  const baseInput: CreateConsignmentDto = {
    recipientId: 'recipient-1',
    routeId: 'route-1',
    pickupHaltId: 'halt-pickup',
    dropoffHaltId: 'halt-dropoff',
    parcelSize: 'SMALL',
    busId: 'bus-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsignmentsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ConsignmentsService>(ConsignmentsService);

    mockPrismaService.user.findUnique.mockResolvedValue({ id: 'recipient-1' });
    mockPrismaService.route.findUnique.mockResolvedValue({ id: 'route-1' });
    mockPrismaService.halt.findUnique
      .mockResolvedValueOnce({ id: 'halt-pickup', routeId: 'route-1' })
      .mockResolvedValueOnce({ id: 'halt-dropoff', routeId: 'route-1' });
    mockPrismaService.$transaction.mockImplementation(
      async (
        callback: (tx: {
          consignment: { create: jest.Mock };
          consignmentEvent: { create: jest.Mock };
        }) => Promise<unknown>,
      ) =>
        callback({
          consignment: { create: jest.fn().mockResolvedValue({ id: 'consignment-1' }) },
          consignmentEvent: { create: jest.fn().mockResolvedValue({}) },
        }),
    );
  });

  it('accepts when the bus belongs to the selected route', async () => {
    mockPrismaService.bus.findUnique.mockResolvedValue({
      id: 'bus-1',
      routeId: 'route-1',
      active: true,
    });

    await expect(service.create('sender-1', baseInput)).resolves.toEqual({ id: 'consignment-1' });
  });

  it('rejects when the bus belongs to a different route', async () => {
    mockPrismaService.bus.findUnique.mockResolvedValue({
      id: 'bus-1',
      routeId: 'other-route',
      active: true,
    });

    await expect(service.create('sender-1', baseInput)).rejects.toThrow(BadRequestException);
    expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
  });

  it('regression: still rejects when the bus is inactive, independent of route match', async () => {
    mockPrismaService.bus.findUnique.mockResolvedValue({
      id: 'bus-1',
      routeId: 'route-1',
      active: false,
    });

    await expect(service.create('sender-1', baseInput)).rejects.toThrow(BadRequestException);
    expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
  });

  it('regression: still rejects when the bus does not exist', async () => {
    mockPrismaService.bus.findUnique.mockResolvedValue(null);

    await expect(service.create('sender-1', baseInput)).rejects.toThrow(NotFoundException);
  });

  it('still succeeds without a busId at all (bus remains optional)', async () => {
    const inputWithoutBus: CreateConsignmentDto = { ...baseInput };
    delete inputWithoutBus.busId;

    await expect(service.create('sender-1', inputWithoutBus)).resolves.toEqual({
      id: 'consignment-1',
    });
    expect(mockPrismaService.bus.findUnique).not.toHaveBeenCalled();
  });
});

describe('ConsignmentsService#create (fare integrity)', () => {
  let service: ConsignmentsService;

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
    route: { findUnique: jest.fn() },
    halt: { findUnique: jest.fn() },
    bus: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };

  const baseInput: CreateConsignmentDto = {
    recipientId: 'recipient-1',
    routeId: 'route-1',
    pickupHaltId: 'halt-pickup',
    dropoffHaltId: 'halt-dropoff',
    parcelSize: 'SMALL',
  };

  function mockTransactionCapturingFareOn(consignmentCreate: jest.Mock) {
    mockPrismaService.$transaction.mockImplementation(
      async (
        callback: (tx: {
          consignment: { create: jest.Mock };
          consignmentEvent: { create: jest.Mock };
        }) => Promise<unknown>,
      ) =>
        callback({
          consignment: { create: consignmentCreate },
          consignmentEvent: { create: jest.fn().mockResolvedValue({}) },
        }),
    );
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsignmentsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ConsignmentsService>(ConsignmentsService);

    mockPrismaService.user.findUnique.mockResolvedValue({ id: 'recipient-1' });
    mockPrismaService.route.findUnique.mockResolvedValue({ id: 'route-1' });
    mockPrismaService.halt.findUnique
      .mockResolvedValueOnce({ id: 'halt-pickup', routeId: 'route-1' })
      .mockResolvedValueOnce({ id: 'halt-dropoff', routeId: 'route-1' });
  });

  it('A: client cannot arbitrarily increase the fare', async () => {
    const consignmentCreate = jest.fn().mockResolvedValue({ id: 'c1' });
    mockTransactionCapturingFareOn(consignmentCreate);

    await service.create('sender-1', { ...baseInput, fare: 999999 });

    const [[call]] = consignmentCreate.mock.calls as Array<[{ data: { fare: number } }]>;
    expect(call.data.fare).toBe(100);
  });

  it('B: client cannot arbitrarily decrease the fare', async () => {
    const consignmentCreate = jest.fn().mockResolvedValue({ id: 'c1' });
    mockTransactionCapturingFareOn(consignmentCreate);

    await service.create('sender-1', { ...baseInput, fare: 0 });

    const [[call]] = consignmentCreate.mock.calls as Array<[{ data: { fare: number } }]>;
    expect(call.data.fare).toBe(100);
  });

  it('C: a valid demo booking gets a deterministic server-authoritative fare across repeated calls', async () => {
    const consignmentCreate = jest.fn().mockResolvedValue({ id: 'c1' });
    mockTransactionCapturingFareOn(consignmentCreate);

    await service.create('sender-1', baseInput);
    mockPrismaService.halt.findUnique
      .mockResolvedValueOnce({ id: 'halt-pickup', routeId: 'route-1' })
      .mockResolvedValueOnce({ id: 'halt-dropoff', routeId: 'route-1' });
    await service.create('sender-1', baseInput);

    const calls = consignmentCreate.mock.calls as Array<[{ data: { fare: number } }]>;
    expect(calls[0][0].data.fare).toBe(calls[1][0].data.fare);
    expect(calls[0][0].data.fare).toBe(100);
  });

  it('accepts a request that omits fare entirely (now optional) and still assigns the demo fare', async () => {
    const consignmentCreate = jest.fn().mockResolvedValue({ id: 'c1' });
    mockTransactionCapturingFareOn(consignmentCreate);

    await service.create('sender-1', baseInput); // baseInput has no `fare` field at all

    const [[call]] = consignmentCreate.mock.calls as Array<[{ data: { fare: number } }]>;
    expect(call.data.fare).toBe(100);
  });
});

describe('ConsignmentsService#findForConductor', () => {
  let service: ConsignmentsService;

  const mockPrismaService = {
    consignment: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsignmentsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ConsignmentsService>(ConsignmentsService);
  });

  it("queries BOOKED consignments OR ones already assigned to this conductor — mirrors findById's existing CONDUCTOR authorization predicate", async () => {
    mockPrismaService.consignment.findMany.mockResolvedValue([]);

    await service.findForConductor('conductor-1');

    expect(mockPrismaService.consignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ status: 'BOOKED' }, { conductorId: 'conductor-1' }] },
      }),
    );
  });

  it('includes sender and recipient summaries, route, halts, and bus', async () => {
    mockPrismaService.consignment.findMany.mockResolvedValue([]);

    await service.findForConductor('conductor-1');

    const calls = mockPrismaService.consignment.findMany.mock.calls as Array<
      [{ include: Record<string, unknown> }]
    >;
    const [[call]] = calls;
    expect(Object.keys(call.include)).toEqual(
      expect.arrayContaining(['sender', 'recipient', 'route', 'pickupHalt', 'dropoffHalt', 'bus']),
    );
  });

  it('strips provenance fields from route/halts/bus for every result (CONDUCTOR is never ADMIN)', async () => {
    mockPrismaService.consignment.findMany.mockResolvedValue([
      {
        id: 'c1',
        route: { id: 'r1', name: 'R', dataSource: 'COMMUNITY_DERIVED', provider: 'osm' },
        pickupHalt: { id: 'h1', dataSource: 'COMMUNITY_DERIVED', provider: 'osm' },
        dropoffHalt: { id: 'h2', dataSource: 'COMMUNITY_DERIVED', provider: 'osm' },
        bus: { id: 'b1', registration: 'B-1', dataSource: 'COMMUNITY_DERIVED', provider: 'osm' },
      },
    ]);

    const [result] = await service.findForConductor('conductor-1');

    expect(result.route).not.toHaveProperty('dataSource');
    expect(result.route).not.toHaveProperty('provider');
    expect(result.pickupHalt).not.toHaveProperty('dataSource');
    expect(result.dropoffHalt).not.toHaveProperty('dataSource');
    expect(result.bus).not.toHaveProperty('dataSource');
  });
});

describe('ConsignmentsService#findForRecipient', () => {
  let service: ConsignmentsService;

  const mockPrismaService = {
    consignment: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsignmentsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ConsignmentsService>(ConsignmentsService);
  });

  it('queries every consignment naming this user as recipientId, at any status', async () => {
    mockPrismaService.consignment.findMany.mockResolvedValue([]);

    await service.findForRecipient('recipient-1');

    expect(mockPrismaService.consignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { recipientId: 'recipient-1' } }),
    );
  });

  it('includes sender, recipient, route, halts, and bus — same shape as findForConductor/findById', async () => {
    mockPrismaService.consignment.findMany.mockResolvedValue([]);

    await service.findForRecipient('recipient-1');

    const calls = mockPrismaService.consignment.findMany.mock.calls as Array<
      [{ include: Record<string, unknown> }]
    >;
    const [[call]] = calls;
    expect(Object.keys(call.include)).toEqual(
      expect.arrayContaining(['sender', 'recipient', 'route', 'pickupHalt', 'dropoffHalt', 'bus']),
    );
  });

  it('strips provenance fields from route/halts/bus for every result (RECIPIENT is never ADMIN)', async () => {
    mockPrismaService.consignment.findMany.mockResolvedValue([
      {
        id: 'c1',
        route: { id: 'r1', name: 'R', dataSource: 'COMMUNITY_DERIVED', sourceUrl: 'https://x' },
        pickupHalt: { id: 'h1', dataSource: 'COMMUNITY_DERIVED', externalId: 'e1' },
        dropoffHalt: { id: 'h2', dataSource: 'COMMUNITY_DERIVED', externalId: 'e2' },
        bus: {
          id: 'b1',
          registration: 'B-1',
          dataSource: 'COMMUNITY_DERIVED',
          fetchedAt: new Date(),
        },
      },
    ]);

    const [result] = await service.findForRecipient('recipient-1');

    expect(result.route).not.toHaveProperty('dataSource');
    expect(result.route).not.toHaveProperty('sourceUrl');
    expect(result.pickupHalt).not.toHaveProperty('externalId');
    expect(result.dropoffHalt).not.toHaveProperty('externalId');
    expect(result.bus).not.toHaveProperty('fetchedAt');
  });
});

describe('ConsignmentsService#findMine (provenance isolation)', () => {
  let service: ConsignmentsService;

  const mockPrismaService = {
    consignment: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsignmentsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ConsignmentsService>(ConsignmentsService);
  });

  it('strips provenance fields from route/halts/bus (SENDER is never ADMIN)', async () => {
    mockPrismaService.consignment.findMany.mockResolvedValue([
      {
        id: 'c1',
        route: { id: 'r1', name: 'R', dataSource: 'SIMULATED', provider: null },
        pickupHalt: { id: 'h1', dataSource: 'SIMULATED', provider: null },
        dropoffHalt: { id: 'h2', dataSource: 'SIMULATED', provider: null },
        bus: null,
      },
    ]);

    const [result] = await service.findMine('sender-1');

    expect(result.route).not.toHaveProperty('dataSource');
    expect(result.route).not.toHaveProperty('provider');
    expect(result.pickupHalt).not.toHaveProperty('dataSource');
    expect(result.dropoffHalt).not.toHaveProperty('dataSource');
    expect(result.bus).toBeNull();
  });
});
