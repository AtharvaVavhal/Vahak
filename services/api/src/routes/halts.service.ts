import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CreateHaltDto } from './dto/create-halt.dto';
import { UpdateHaltDto } from './dto/update-halt.dto';

@Injectable()
export class HaltsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(routeId: string, dto: CreateHaltDto) {
    // Ensure route exists
    const route = await this.prisma.route.findUnique({ where: { id: routeId } });
    if (!route) throw new NotFoundException('Route not found');

    // Check unique sequence per route
    const existing = await this.prisma.halt.findFirst({
      where: { routeId, sequence: dto.sequence },
    });
    if (existing) {
      throw new BadRequestException('Halt sequence already exists for this route');
    }

    return this.prisma.halt.create({
      data: {
        name: dto.name,
        sequence: dto.sequence,
        latitude: dto.latitude,
        longitude: dto.longitude,
        route: { connect: { id: routeId } },
      },
    });
  }

  async findAllByRoute(routeId: string) {
    const route = await this.prisma.route.findUnique({ where: { id: routeId } });
    if (!route) throw new NotFoundException('Route not found');
    return this.prisma.halt.findMany({
      where: { routeId },
      orderBy: { sequence: 'asc' },
    });
  }

  async findOne(id: string) {
    const halt = await this.prisma.halt.findUnique({ where: { id } });
    if (!halt) throw new NotFoundException('Halt not found');
    return halt;
  }

  async update(id: string, dto: UpdateHaltDto) {
    const halt = await this.findOne(id);
    if (dto.sequence !== undefined) {
      const existing = await this.prisma.halt.findFirst({
        where: { routeId: halt.routeId, sequence: dto.sequence, NOT: { id } },
      });
      if (existing) {
        throw new BadRequestException('Halt sequence already exists for this route');
      }
    }
    return this.prisma.halt.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.halt.delete({ where: { id } });
    } catch (e: unknown) {
      const prismaError = e as { code?: string };
      if (prismaError.code === 'P2003') {
        throw new BadRequestException('Cannot delete halt: referenced by existing consignments');
      }
      throw e;
    }
  }
}
