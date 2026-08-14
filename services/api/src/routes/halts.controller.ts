import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { HaltsService } from './halts.service';
import { CreateHaltDto } from './dto/create-halt.dto';
import { UpdateHaltDto } from './dto/update-halt.dto';
import { toPublicHalt } from '../shared/provenance';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    phone: string;
    role: 'SENDER' | 'CONDUCTOR' | 'RECIPIENT' | 'ADMIN';
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('routes/:routeId/halts')
export class HaltsController {
  constructor(private readonly haltsService: HaltsService) {}

  @Post()
  @Roles('ADMIN')
  create(@Param('routeId') routeId: string, @Body() dto: CreateHaltDto) {
    return this.haltsService.create(routeId, dto);
  }

  // Shared by ADMIN and CONDUCTOR; CONDUCTOR never sees provenance fields.
  @Get()
  @Roles('ADMIN', 'CONDUCTOR')
  async findAll(@Param('routeId') routeId: string, @Req() request: AuthenticatedRequest) {
    const halts = await this.haltsService.findAllByRoute(routeId);
    return request.user.role === 'ADMIN' ? halts : halts.map(toPublicHalt);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('halts')
export class HaltsSingleController {
  constructor(private readonly haltsService: HaltsService) {}

  @Get(':id')
  @Roles('ADMIN', 'CONDUCTOR')
  async findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const halt = await this.haltsService.findOne(id);
    return request.user.role === 'ADMIN' ? halt : toPublicHalt(halt);
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
