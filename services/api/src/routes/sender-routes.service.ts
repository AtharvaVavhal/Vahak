import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { SenderRouteDto } from './dto/sender-route.dto';
import { SenderHaltDto } from './dto/sender-halt.dto';

/**
 * SENDER-facing route/halt browsing. Deliberately separate from
 * RoutesService/HaltsService (which stay ADMIN/CONDUCTOR-only, unfiltered,
 * full-row): this service only ever reads dataSource=SIMULATED rows and
 * only ever returns the narrow, explicit DTOs below. It must never be
 * extended to read provider=osm/COMMUNITY_DERIVED data — production use of
 * OSM-derived data is blocked pending legal/product approval (Milestone
 * 5-7), and this endpoint exists specifically to serve real product
 * functionality without touching that data at all.
 */
@Injectable()
export class SenderRoutesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAvailableRoutes(): Promise<SenderRouteDto[]> {
    const routes = await this.prisma.route.findMany({
      where: { dataSource: 'SIMULATED' },
      orderBy: { name: 'asc' },
      select: { id: true, routeRef: true, name: true, origin: true, destination: true },
    });

    return routes.map((route) => ({
      id: route.id,
      routeRef: route.routeRef,
      name: route.name,
      origin: route.origin,
      destination: route.destination,
    }));
  }

  async findAvailableHalts(routeId: string): Promise<SenderHaltDto[]> {
    const route = await this.prisma.route.findUnique({
      where: { id: routeId },
      select: { id: true, dataSource: true },
    });

    // A non-SIMULATED route (including any real OSM/COMMUNITY_DERIVED
    // route) must behave as if it does not exist for this endpoint — never
    // reveal its existence, never fall through to serving its halts.
    if (!route || route.dataSource !== 'SIMULATED') {
      throw new NotFoundException('Route not found');
    }

    const halts = await this.prisma.halt.findMany({
      where: { routeId, dataSource: 'SIMULATED' },
      orderBy: { sequence: 'asc' },
      select: { id: true, name: true, sequence: true, latitude: true, longitude: true },
    });

    return halts.map((halt) => ({
      id: halt.id,
      name: halt.name,
      sequence: halt.sequence,
      latitude: halt.latitude === null ? null : Number(halt.latitude),
      longitude: halt.longitude === null ? null : Number(halt.longitude),
    }));
  }
}
