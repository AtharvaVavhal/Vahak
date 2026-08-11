import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../shared/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: input.phone },
          ...(input.email ? [{ email: input.email }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('Phone or email is already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email,
        passwordHash,
        role: input.role ?? 'SENDER',
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: input.phone },
    });

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    return this.buildAuthResponse(user);
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private buildAuthResponse(user: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    role: 'SENDER' | 'CONDUCTOR' | 'RECIPIENT' | 'ADMIN';
  }) {
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    };
  }
}
