import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { HaltsService } from './halts.service';
import { CreateHaltDto } from './dto/create-halt.dto';
import { UpdateHaltDto } from './dto/update-halt.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('routes/:routeId/halts')
export class HaltsController {
  constructor(private readonly haltsService: HaltsService) {}

  @Post()
  @Roles('ADMIN')
  create(@Param('routeId') routeId: string, @Body() dto: CreateHaltDto) {
    return this.haltsService.create(routeId, dto);
  }

  @Get()
  @Roles('ADMIN', 'CONDUCTOR')
  findAll(@Param('routeId') routeId: string) {
    return this.haltsService.findAllByRoute(routeId);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('halts')
export class HaltsSingleController {
  constructor(private readonly haltsService: HaltsService) {}

  @Get(':id')
  @Roles('ADMIN', 'CONDUCTOR')
  findOne(@Param('id') id: string) {
    return this.haltsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateHaltDto) {
    return this.haltsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.haltsService.remove(id);
  }
}
