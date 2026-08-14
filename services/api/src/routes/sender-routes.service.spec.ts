import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SenderRoutesService } from './sender-routes.service';
import { PrismaService } from '../shared/prisma/prisma.service';

describe('SenderRoutesService#findAvailableRoutes', () => {
  let service: SenderRoutesService;

  const mockPrismaService = {
    route: { findMany: jest.fn() },
    halt: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [SenderRoutesService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<SenderRoutesService>(SenderRoutesService);
  });

  it('queries only dataSource=SIMULATED routes, not provider IS NULL', async () => {
    mockPrismaService.route.findMany.mockResolvedValue([]);

    await service.findAvailableRoutes();

    expect(mockPrismaService.route.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { dataSource: 'SIMULATED' } }),
    );
  });

  it('returns only the allow-listed fields, never provenance', async () => {
    mockPrismaService.route.findMany.mockResolvedValue([
      {
        id: 'route-1',
        routeRef: null,
        name: 'QA Demo Route',
        origin: 'QA Origin Halt',
        destination: 'QA Destination Halt',
      },
    ]);

    const result = await service.findAvailableRoutes();

    expect(result).toEqual([
      {
        id: 'route-1',
        routeRef: null,
        name: 'QA Demo Route',
        origin: 'QA Origin Halt',
        destination: 'QA Destination Halt',
      },
    ]);
  });

  it('never selects provider/externalId/sourceUrl/fetchedAt from the database', async () => {
    mockPrismaService.route.findMany.mockResolvedValue([]);

    await service.findAvailableRoutes();

    const calls = mockPrismaService.route.findMany.mock.calls as Array<
      [{ select: Record<string, boolean> }]
    >;
    const [[call]] = calls;
    expect(call.select).toEqual({
      id: true,
      routeRef: true,
      name: true,
      origin: true,
      destination: true,
    });
  });
});

describe('SenderRoutesService#findAvailableHalts', () => {
  let service: SenderRoutesService;

  const mockPrismaService = {
    route: { findUnique: jest.fn() },
    halt: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [SenderRoutesService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<SenderRoutesService>(SenderRoutesService);
  });

  it('returns 404 when the route does not exist', async () => {
    mockPrismaService.route.findUnique.mockResolvedValue(null);

    await expect(service.findAvailableHalts('missing-route')).rejects.toThrow(NotFoundException);
  });

  it('returns 404 when the route is COMMUNITY_DERIVED (OSM) rather than SIMULATED', async () => {
    mockPrismaService.route.findUnique.mockResolvedValue({
      id: 'route-1',
      dataSource: 'COMMUNITY_DERIVED',
    });

    await expect(service.findAvailableHalts('route-1')).rejects.toThrow(NotFoundException);
    expect(mockPrismaService.halt.findMany).not.toHaveBeenCalled();
  });

  it('queries halts scoped to both routeId and dataSource=SIMULATED, ordered by sequence ascending', async () => {
    mockPrismaService.route.findUnique.mockResolvedValue({
      id: 'route-1',
      dataSource: 'SIMULATED',
    });
    mockPrismaService.halt.findMany.mockResolvedValue([]);

    await service.findAvailableHalts('route-1');

    expect(mockPrismaService.halt.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { routeId: 'route-1', dataSource: 'SIMULATED' },
        orderBy: { sequence: 'asc' },
      }),
    );
  });

  it('converts Decimal latitude/longitude to plain numbers and excludes provenance fields', async () => {
    mockPrismaService.route.findUnique.mockResolvedValue({
      id: 'route-1',
      dataSource: 'SIMULATED',
    });
    mockPrismaService.halt.findMany.mockResolvedValue([
      {
        id: 'halt-1',
        name: 'QA Halt A',
        sequence: 1,
        latitude: { toString: () => '18.53' },
        longitude: null,
      },
    ]);

    const result = await service.findAvailableHalts('route-1');

    expect(result).toEqual([
      { id: 'halt-1', name: 'QA Halt A', sequence: 1, latitude: 18.53, longitude: null },
    ]);
  });
});
