import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsInt, Min, IsOptional, IsNumber } from 'class-validator';

export class CreateHaltDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequence: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;
}
