import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { toPublicBus, toPublicHalt, toPublicRoute } from '../shared/provenance';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    phone: string;
    role: 'SENDER' | 'CONDUCTOR' | 'RECIPIENT' | 'ADMIN';
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateRouteDto) {
    return this.routesService.create(dto);
  }

  // This endpoint is shared by ADMIN and CONDUCTOR. ADMIN keeps the full,
  // unfiltered row (provenance included); CONDUCTOR — a non-admin role —
  // never sees dataSource/provider/externalId/sourceUrl/fetchedAt, on the
  // route itself or on its nested halts/buses.
  @Get()
  @Roles('ADMIN', 'CONDUCTOR')
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.routesService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );

    if (request.user.role === 'ADMIN') {
      return result;
    }

    return {
      ...result,
      data: result.data.map((route) => ({
        ...toPublicRoute(route),
        halts: route.halts.map(toPublicHalt),
        buses: route.buses.map(toPublicBus),
      })),
    };
  }

  @Get(':id')
  @Roles('ADMIN', 'CONDUCTOR')
  async findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const route = await this.routesService.findOne(id);

    if (request.user.role === 'ADMIN') {
      return route;
    }

    return {
      ...toPublicRoute(route),
      halts: route.halts.map(toPublicHalt),
      buses: route.buses.map(toPublicBus),
    };
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateRouteDto) {
    return this.routesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.routesService.remove(id);
  }
}
