import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRouteDto) {
    return this.prisma.route.create({
      data: {
        name: dto.name,
        origin: dto.origin,
        destination: dto.destination,
      },
    });
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.route.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { halts: { orderBy: { sequence: 'asc' } }, buses: true },
      }),
      this.prisma.route.count(),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: { halts: { orderBy: { sequence: 'asc' } }, buses: true },
    });
    if (!route) throw new NotFoundException('Route not found');
    return route;
  }

  async update(id: string, dto: UpdateRouteDto) {
    await this.findOne(id);
    return this.prisma.route.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    // Deleting route will cascade delete halts (onDelete:Cascade) but restrict if consignments exist.
    // Prisma will throw P2003 if restrict violated.
    try {
      await this.prisma.route.delete({ where: { id } });
    } catch (e: unknown) {
      const prismaError = e as { code?: string };
      if (prismaError.code === 'P2003') {
        throw new BadRequestException('Cannot delete route: referenced by existing consignments');
      }
      throw e;
    }
  }
}
