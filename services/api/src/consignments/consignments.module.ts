import { Module } from '@nestjs/common';
import { PrismaModule } from '../shared/prisma/prisma.module';
import { ConsignmentsController } from './consignments.controller';
import { ConsignmentsService } from './consignments.service';

@Module({
  imports: [PrismaModule],
  controllers: [ConsignmentsController],
  providers: [ConsignmentsService],
})
export class ConsignmentsModule {}
