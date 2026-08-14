import { Test, TestingModule } from '@nestjs/testing';
import { RoutesService } from './routes.service';
import { PrismaService } from '../shared/prisma/prisma.service';

describe('RoutesService#create', () => {
  let service: RoutesService;

  const mockPrismaService = {
    route: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [RoutesService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<RoutesService>(RoutesService);
  });

  it('creates a route with only name/origin/destination, leaving provenance to the database default', async () => {
    mockPrismaService.route.create.mockResolvedValue({ id: 'route-1' });

    await service.create({ name: 'Test Route', origin: 'A', destination: 'B' });

    expect(mockPrismaService.route.create).toHaveBeenCalledWith({
      data: { name: 'Test Route', origin: 'A', destination: 'B' },
    });
  });
});
