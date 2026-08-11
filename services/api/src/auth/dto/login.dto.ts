import { IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^[0-9]{10}$/, {
    message: 'Phone must be exactly 10 digits',
  })
  phone!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
