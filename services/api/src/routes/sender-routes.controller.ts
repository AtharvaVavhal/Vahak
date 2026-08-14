import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SenderRoutesService } from './sender-routes.service';

/**
 * Registered under 'routes/available' — a static prefix, deliberately
 * distinct from RoutesController's 'routes/:id'. Must be registered before
 * RoutesController in routes.module.ts's controllers array, or Nest/Express
 * would match 'GET /routes/available' against RoutesController's
 * 'GET /routes/:id' (id="available") instead of reaching this controller.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('routes/available')
export class SenderRoutesController {
  constructor(private readonly senderRoutesService: SenderRoutesService) {}

  @Get()
  @Roles('SENDER')
  findAvailableRoutes() {
    return this.senderRoutesService.findAvailableRoutes();
  }

  @Get(':routeId/halts')
  @Roles('SENDER')
  findAvailableHalts(@Param('routeId') routeId: string) {
    return this.senderRoutesService.findAvailableHalts(routeId);
  }
}
