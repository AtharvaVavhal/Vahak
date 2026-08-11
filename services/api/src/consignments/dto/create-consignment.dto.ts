import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ParcelSize } from '../../generated/prisma/client';

export class CreateConsignmentDto {
  @IsUUID()
  recipientId: string;

  @IsUUID()
  routeId: string;

  @IsUUID()
  pickupHaltId: string;

  @IsUUID()
  dropoffHaltId: string;

  @IsEnum(ParcelSize)
  parcelSize: ParcelSize;

  @IsOptional()
  @IsUUID()
  busId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fare: number;
}
