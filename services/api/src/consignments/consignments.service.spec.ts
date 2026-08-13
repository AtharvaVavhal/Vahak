import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConsignmentsService } from './consignments.service';
import { PrismaService } from '../shared/prisma/prisma.service';

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
