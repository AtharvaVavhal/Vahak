import { Get, Param } from '@nestjs/common';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateConsignmentDto } from './dto/create-consignment.dto';
import { ConsignmentsService } from './consignments.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    phone: string;
    role: 'SENDER' | 'CONDUCTOR' | 'RECIPIENT' | 'ADMIN';
  };
}

@Controller('consignments')
export class ConsignmentsController {
  constructor(private readonly consignmentsService: ConsignmentsService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findById(@Param('id') id: string) {
    return this.consignmentsService.findById(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findMine(@Req() request: AuthenticatedRequest) {
    return this.consignmentsService.findMine(request.user.id);
  }

  @Post(':id/book')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SENDER')
  book(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.consignmentsService.book(id, request.user.id);
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CONDUCTOR')
  accept(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.consignmentsService.accept(id, request.user.id);
  }

  @Post(':id/handover')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CONDUCTOR')
  initiateHandover(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.consignmentsService.initiateHandover(id, request.user.id);
  }

  @Post(':id/handover/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RECIPIENT')
  verifyHandover(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
    @Body() body: { pin: string },
  ) {
    return this.consignmentsService.verifyHandover(id, request.user.id, body.pin);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SENDER')
  cancel(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.consignmentsService.cancel(id, request.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SENDER')
  create(@Req() request: AuthenticatedRequest, @Body() body: CreateConsignmentDto) {
    return this.consignmentsService.create(request.user.id, body);
  }
}
