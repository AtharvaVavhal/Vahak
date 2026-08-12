import { PartialType } from '@nestjs/mapped-types';
import { CreateHaltDto } from './create-halt.dto';

export class UpdateHaltDto extends PartialType(CreateHaltDto) {}
