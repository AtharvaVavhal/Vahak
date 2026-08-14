import { Module } from '@nestjs/common';
import { PrismaModule } from '../shared/prisma/prisma.module';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';
import { SenderRoutesController } from './sender-routes.controller';
import { SenderRoutesService } from './sender-routes.service';
import { HaltsController, HaltsSingleController } from './halts.controller';
import { HaltsService } from './halts.service';
import { BusesController, BusesSingleController } from './buses.controller';
import { BusesService } from './buses.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    // Registered before RoutesController: 'routes/available' is a static
    // path that would otherwise be captured by RoutesController's
    // 'routes/:id' if that controller were matched first.
    SenderRoutesController,
    RoutesController,
    HaltsController,
    HaltsSingleController,
    BusesController,
    BusesSingleController,
  ],
  providers: [RoutesService, SenderRoutesService, HaltsService, BusesService],
})
export class RoutesModule {}
