import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomInt } from 'crypto';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CreateConsignmentDto } from './dto/create-consignment.dto';

@Injectable()
export class ConsignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(senderId: string, input: CreateConsignmentDto) {
    const recipient = await this.prisma.user.findUnique({
      where: { id: input.recipientId },
    });

    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    const route = await this.prisma.route.findUnique({
      where: { id: input.routeId },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    const pickupHalt = await this.prisma.halt.findUnique({
      where: { id: input.pickupHaltId },
    });

    if (!pickupHalt) {
      throw new NotFoundException('Pickup halt not found');
    }

    const dropoffHalt = await this.prisma.halt.findUnique({
      where: { id: input.dropoffHaltId },
    });

    if (!dropoffHalt) {
      throw new NotFoundException('Dropoff halt not found');
    }

    // Validate bus if provided
    if (input.busId) {
      const bus = await this.prisma.bus.findUnique({
        where: { id: input.busId },
      });
      if (!bus) {
        throw new NotFoundException('Bus not found');
      }
      if (!bus.active) {
        throw new BadRequestException('Selected bus is inactive');
      }
    }

    const trackingCode = `VHK-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

    return this.prisma.$transaction(async (tx) => {
      const consignment = await tx.consignment.create({
        data: {
          trackingCode,
          senderId,
          recipientId: input.recipientId,
          routeId: input.routeId,
          pickupHaltId: input.pickupHaltId,
          dropoffHaltId: input.dropoffHaltId,
          parcelSize: input.parcelSize,
          description: input.description,
          fare: input.fare,
          busId: input.busId,
          status: 'CREATED',
        },
      });

      await tx.consignmentEvent.create({
        data: {
          consignmentId: consignment.id,
          actorId: senderId,
          type: 'CREATED',
        },
      });

      return consignment;
    });
  }

  async book(id: string, senderId: string) {
    const consignment = await this.prisma.consignment.findUnique({
      where: { id },
    });

    if (!consignment) {
      throw new NotFoundException('Consignment not found');
    }

    if (consignment.senderId !== senderId) {
      throw new ForbiddenException('You do not own this consignment');
    }

    if (consignment.status !== 'CREATED') {
      throw new BadRequestException(`Cannot book consignment from status ${consignment.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedConsignment = await tx.consignment.update({
        where: { id },
        data: {
          status: 'BOOKED',
        },
      });

      await tx.consignmentEvent.create({
        data: {
          consignmentId: id,
          actorId: senderId,
          type: 'BOOKED',
        },
      });

      return updatedConsignment;
    });
  }

  async accept(id: string, conductorId: string) {
    const consignment = await this.prisma.consignment.findUnique({
      where: { id },
    });

    if (!consignment) {
      throw new NotFoundException('Consignment not found');
    }

    if (consignment.status !== 'BOOKED') {
      throw new BadRequestException(`Cannot accept consignment from status ${consignment.status}`);
    }

    const conductor = await this.prisma.user.findUnique({
      where: { id: conductorId },
    });

    if (!conductor) {
      throw new NotFoundException('Conductor not found');
    }

    if (conductor.role !== 'CONDUCTOR') {
      throw new ForbiddenException('Only conductors can accept consignments');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedConsignment = await tx.consignment.update({
        where: { id },
        data: {
          conductorId,
          status: 'ACCEPTED',
        },
      });

      await tx.consignmentEvent.create({
        data: {
          consignmentId: id,
          actorId: conductorId,
          type: 'ACCEPTED',
        },
      });

      return updatedConsignment;
    });
  }

  async initiateHandover(id: string, conductorId: string) {
    const consignment = await this.prisma.consignment.findUnique({
      where: { id },
    });

    if (!consignment) {
      throw new NotFoundException('Consignment not found');
    }

    if (consignment.conductorId !== conductorId) {
      throw new ForbiddenException('Only the assigned conductor can initiate handover');
    }

    if (consignment.status !== 'ACCEPTED') {
      throw new BadRequestException(`Cannot initiate handover from status ${consignment.status}`);
    }

    const pin = randomInt(100000, 1000000).toString();
    const nonce = randomInt(100000000, 1000000000).toString();

    const codeHash = createHash('sha256').update(`${pin}:${nonce}`).digest('hex');

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
      const updatedConsignment = await tx.consignment.update({
        where: { id },
        data: {
          status: 'IN_TRANSIT',
        },
      });

      await tx.deliveryProof.create({
        data: {
          consignmentId: id,
          type: 'PIN',
          codeHash,
          nonce,
          expiresAt,
        },
      });

      await tx.consignmentEvent.create({
        data: {
          consignmentId: id,
          actorId: conductorId,
          type: 'HANDOVER_INITIATED',
        },
      });

      return {
        ...updatedConsignment,
        handoverPin: pin,
        handoverPinExpiresAt: expiresAt,
      };
    });
  }

  async verifyHandover(id: string, recipientId: string, pin: string) {
    const consignment = await this.prisma.consignment.findUnique({
      where: { id },
    });

    if (!consignment) {
      throw new NotFoundException('Consignment not found');
    }

    if (consignment.recipientId !== recipientId) {
      throw new ForbiddenException('Only the recipient can verify this handover');
    }

    if (consignment.status !== 'IN_TRANSIT') {
      throw new BadRequestException(`Cannot verify handover from status ${consignment.status}`);
    }

    if (!/^\d{6}$/.test(pin)) {
      throw new BadRequestException('Handover PIN must be 6 digits');
    }

    const proof = await this.prisma.deliveryProof.findUnique({
      where: {
        consignmentId: id,
      },
    });

    if (!proof) {
      throw new NotFoundException('Handover proof not found');
    }

    if (proof.type !== 'PIN') {
      throw new BadRequestException('Unsupported handover proof type');
    }

    if (proof.verifiedAt) {
      throw new BadRequestException('Handover has already been verified');
    }

    if (proof.expiresAt <= new Date()) {
      throw new BadRequestException('Handover PIN has expired');
    }

    const MAX_ATTEMPTS = 5;
    if (proof.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException('Maximum PIN verification attempts exceeded');
    }

    const codeHash = createHash('sha256').update(`${pin}:${proof.nonce}`).digest('hex');

    if (codeHash !== proof.codeHash) {
      // Increment failed attempt counter
      await this.prisma.deliveryProof.update({
        where: { id: proof.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid handover PIN');
    }

    return this.prisma.$transaction(async (tx) => {
      const verifiedAt = new Date();

      const updatedProof = await tx.deliveryProof.update({
        where: {
          id: proof.id,
        },
        data: {
          verifiedAt,
        },
      });

      const updatedConsignment = await tx.consignment.update({
        where: { id },
        data: {
          status: 'DELIVERED',
        },
      });

      await tx.consignmentEvent.create({
        data: {
          consignmentId: id,
          actorId: recipientId,
          type: 'HANDOVER_VERIFIED',
        },
      });

      await tx.consignmentEvent.create({
        data: {
          consignmentId: id,
          actorId: recipientId,
          type: 'DELIVERED',
        },
      });

      return {
        consignment: updatedConsignment,
        proof: updatedProof,
      };
    });
  }

  async findMine(senderId: string) {
    return this.prisma.consignment.findMany({
      where: {
        senderId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        recipient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        route: true,
        pickupHalt: true,
        dropoffHalt: true,
        bus: true,
      },
    });
  }

  async findById(
    id: string,
    user: { id: string; role: 'SENDER' | 'CONDUCTOR' | 'RECIPIENT' | 'ADMIN' },
  ) {
    const consignment = await this.prisma.consignment.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        route: true,
        pickupHalt: true,
        dropoffHalt: true,
        bus: true,
      },
    });

    if (!consignment) {
      throw new NotFoundException('Consignment not found');
    }

    const isAuthorized =
      user.role === 'ADMIN' ||
      (user.role === 'SENDER' && consignment.senderId === user.id) ||
      (user.role === 'RECIPIENT' && consignment.recipientId === user.id) ||
      (user.role === 'CONDUCTOR' &&
        (consignment.conductorId === user.id || consignment.status === 'BOOKED'));

    if (!isAuthorized) {
      throw new ForbiddenException('You do not have access to this consignment');
    }

    return consignment;
  }

  async cancel(id: string, senderId: string) {
    const consignment = await this.prisma.consignment.findUnique({
      where: { id },
    });

    if (!consignment) {
      throw new NotFoundException('Consignment not found');
    }

    if (consignment.senderId !== senderId) {
      throw new ForbiddenException('You do not own this consignment');
    }

    if (consignment.status === 'DELIVERED' || consignment.status === 'CANCELLED') {
      throw new BadRequestException(`Cannot cancel consignment from status ${consignment.status}`);
    }

    // Allow cancellation from CREATED, BOOKED, ACCEPTED, IN_TRANSIT
    const allowedStatuses = ['CREATED', 'BOOKED', 'ACCEPTED', 'IN_TRANSIT'];
    if (!allowedStatuses.includes(consignment.status)) {
      throw new BadRequestException(`Cannot cancel consignment from status ${consignment.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedConsignment = await tx.consignment.update({
        where: { id },
        data: {
          status: 'CANCELLED',
        },
      });

      await tx.consignmentEvent.create({
        data: {
          consignmentId: id,
          actorId: senderId,
          type: 'CANCELLED',
        },
      });

      return updatedConsignment;
    });
  }
}
