import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
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

  /**
   * Accepted for backward compatibility with existing callers, but never
   * trusted: ConsignmentsService.create() always persists a server-computed
   * fare and ignores this value. See ../fare.ts.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fare?: number;
}
