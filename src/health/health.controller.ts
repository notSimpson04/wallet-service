import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      // Simple lightweight query to verify DB connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error: any) {
      throw new InternalServerErrorException({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        message: error.message,
      });
    }
  }
}