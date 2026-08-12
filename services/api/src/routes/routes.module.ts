import { Module } from '@nestjs/common';
import { PrismaModule } from '../shared/prisma/prisma.module';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';
import { HaltsController, HaltsSingleController } from './halts.controller';
import { HaltsService } from './halts.service';
import { BusesController, BusesSingleController } from './buses.controller';
import { BusesService } from './buses.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    RoutesController,
    HaltsController,
    HaltsSingleController,
    BusesController,
    BusesSingleController,
  ],
  providers: [RoutesService, HaltsService, BusesService],
})
export class RoutesModule {}
