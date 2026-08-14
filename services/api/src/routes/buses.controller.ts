import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BusesService } from './buses.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { toPublicBus } from '../shared/provenance';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    phone: string;
    role: 'SENDER' | 'CONDUCTOR' | 'RECIPIENT' | 'ADMIN';
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('routes/:routeId/buses')
export class BusesController {
  constructor(private readonly busesService: BusesService) {}

  @Post()
  @Roles('ADMIN')
  create(@Param('routeId') routeId: string, @Body() dto: CreateBusDto) {
    return this.busesService.create(routeId, dto);
  }

  // Shared by ADMIN and CONDUCTOR; CONDUCTOR never sees provenance fields.
  @Get()
  @Roles('ADMIN', 'CONDUCTOR')
  async findAll(@Param('routeId') routeId: string, @Req() request: AuthenticatedRequest) {
    const buses = await this.busesService.findAllByRoute(routeId);
    return request.user.role === 'ADMIN' ? buses : buses.map(toPublicBus);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('buses')
export class BusesSingleController {
  constructor(private readonly busesService: BusesService) {}

  @Get(':id')
  @Roles('ADMIN', 'CONDUCTOR')
  async findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const bus = await this.busesService.findOne(id);
    return request.user.role === 'ADMIN' ? bus : toPublicBus(bus);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateBusDto) {
    return this.busesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.busesService.remove(id);
  }
}
