import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  phone: string;
  role: 'SENDER' | 'CONDUCTOR' | 'RECIPIENT' | 'ADMIN';
}

export interface AuthenticatedUser {
  id: string;
  phone: string;
  role: 'SENDER' | 'CONDUCTOR' | 'RECIPIENT' | 'ADMIN';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      phone: payload.phone,
      role: payload.role,
    };
  }
}
