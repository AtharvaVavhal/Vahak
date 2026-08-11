import { IsEmail, IsIn, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsString()
  @Matches(/^[0-9]{10}$/, {
    message: 'Phone must be exactly 10 digits',
  })
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsIn(['SENDER', 'CONDUCTOR', 'RECIPIENT'])
  role?: 'SENDER' | 'CONDUCTOR' | 'RECIPIENT';
}
