import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';

@Injectable()
export class BusesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(routeId: string, dto: CreateBusDto) {
    const route = await this.prisma.route.findUnique({ where: { id: routeId } });
    if (!route) throw new NotFoundException('Route not found');

    const existing = await this.prisma.bus.findUnique({
      where: { registration: dto.registration },
    });
    if (existing) {
      throw new BadRequestException('Bus registration already exists');
    }

    return this.prisma.bus.create({
      data: {
        registration: dto.registration,
        route: { connect: { id: routeId } },
      },
    });
  }

  async findAllByRoute(routeId: string) {
    const route = await this.prisma.route.findUnique({ where: { id: routeId } });
    if (!route) throw new NotFoundException('Route not found');
    return this.prisma.bus.findMany({ where: { routeId } });
  }

  async findOne(id: string) {
    const bus = await this.prisma.bus.findUnique({ where: { id } });
    if (!bus) throw new NotFoundException('Bus not found');
    return bus;
  }

  async update(id: string, dto: UpdateBusDto) {
    await this.findOne(id);
    if (dto.registration !== undefined) {
      const existing = await this.prisma.bus.findUnique({
        where: { registration: dto.registration },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('Bus registration already exists');
      }
    }
    return this.prisma.bus.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    // Bus deletion uses SetNull on consignments, so no restrict error expected.
    await this.prisma.bus.delete({ where: { id } });
  }
}
