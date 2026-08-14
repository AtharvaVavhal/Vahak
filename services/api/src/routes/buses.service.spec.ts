import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BusesService } from './buses.service';
import { PrismaService } from '../shared/prisma/prisma.service';

describe('BusesService#create', () => {
  let service: BusesService;

  const mockPrismaService = {
    route: {
      findUnique: jest.fn(),
    },
    bus: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [BusesService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<BusesService>(BusesService);
  });

  it('creates a bus with only registration, leaving provenance and active to the database default', async () => {
    mockPrismaService.route.findUnique.mockResolvedValue({ id: 'route-1' });
    mockPrismaService.bus.findUnique.mockResolvedValue(null);
    mockPrismaService.bus.create.mockResolvedValue({ id: 'bus-1' });

    await service.create('route-1', { registration: 'MH-12-AB-1234' });

    expect(mockPrismaService.bus.create).toHaveBeenCalledWith({
      data: {
        registration: 'MH-12-AB-1234',
        route: { connect: { id: 'route-1' } },
      },
    });
  });

  it('rejects when the route does not exist', async () => {
    mockPrismaService.route.findUnique.mockResolvedValue(null);

    await expect(
      service.create('missing-route', { registration: 'MH-12-AB-1234' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects a duplicate registration', async () => {
    mockPrismaService.route.findUnique.mockResolvedValue({ id: 'route-1' });
    mockPrismaService.bus.findUnique.mockResolvedValue({ id: 'existing-bus' });

    await expect(service.create('route-1', { registration: 'MH-12-AB-1234' })).rejects.toThrow(
      BadRequestException,
    );
  });
});
