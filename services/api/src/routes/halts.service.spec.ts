import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HaltsService } from './halts.service';
import { PrismaService } from '../shared/prisma/prisma.service';

describe('HaltsService#create', () => {
  let service: HaltsService;

  const mockPrismaService = {
    route: {
      findUnique: jest.fn(),
    },
    halt: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [HaltsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<HaltsService>(HaltsService);
  });

  it('creates a halt with only its own fields, leaving provenance to the database default', async () => {
    mockPrismaService.route.findUnique.mockResolvedValue({ id: 'route-1' });
    mockPrismaService.halt.findFirst.mockResolvedValue(null);
    mockPrismaService.halt.create.mockResolvedValue({ id: 'halt-1' });

    await service.create('route-1', { name: 'Test Halt', sequence: 1 });

    expect(mockPrismaService.halt.create).toHaveBeenCalledWith({
      data: {
        name: 'Test Halt',
        sequence: 1,
        latitude: undefined,
        longitude: undefined,
        route: { connect: { id: 'route-1' } },
      },
    });
  });

  it('rejects when the route does not exist', async () => {
    mockPrismaService.route.findUnique.mockResolvedValue(null);

    await expect(
      service.create('missing-route', { name: 'Test Halt', sequence: 1 }),
    ).rejects.toThrow(NotFoundException);
  });
});
