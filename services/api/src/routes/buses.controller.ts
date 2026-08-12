import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BusesService } from './buses.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('routes/:routeId/buses')
export class BusesController {
  constructor(private readonly busesService: BusesService) {}

  @Post()
  @Roles('ADMIN')
  create(@Param('routeId') routeId: string, @Body() dto: CreateBusDto) {
    return this.busesService.create(routeId, dto);
  }

  @Get()
  @Roles('ADMIN', 'CONDUCTOR')
  findAll(@Param('routeId') routeId: string) {
    return this.busesService.findAllByRoute(routeId);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('buses')
export class BusesSingleController {
  constructor(private readonly busesService: BusesService) {}

  @Get(':id')
  @Roles('ADMIN', 'CONDUCTOR')
  findOne(@Param('id') id: string) {
    return this.busesService.findOne(id);
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
