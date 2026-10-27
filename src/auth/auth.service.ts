import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlacklistService } from '../blacklist/blacklist.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private blacklistService: BlacklistService,
  ) {}

  async register(dto: { email: string; password: string; firstName?: string; lastName?: string }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    const { passwordHash, ...result } = user;
    return { message: 'User registered successfully', user: result };
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // --- CHECK BLACKLIST ---
    const isBlacklisted = await this.blacklistService.isUserBlacklisted(user.id);
    if (isBlacklisted) {
      throw new ForbiddenException('This account has been blacklisted.');
    }

    if (user.isBlocked) { // Or UserStatus.BLOCKED if you import your Prisma enums
    throw new ForbiddenException('This account has been blocked.');
  }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Login successful',
      access_token: accessToken,
    };
  }
}