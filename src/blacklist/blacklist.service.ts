import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlacklistService {
  constructor(private prisma: PrismaService) {}

  // 1. Add a user to the blacklist records
  async blacklistUser(userId: string, adminId: string, reason: string) {
    const existing = await this.prisma.blacklistRecord.findFirst({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('User is already blacklisted');
    }

    return this.prisma.blacklistRecord.create({
      data: {
        userId,
        actorId: adminId,
        reason,
      },
    });
  }

  // 2. Remove a user from the blacklist
  async removeFromBlacklist(recordId: string) {
    const record = await this.prisma.blacklistRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new NotFoundException('Blacklist record not found');
    }

    return this.prisma.blacklistRecord.delete({
      where: { id: recordId },
    });
  }

  // 3. Get all blacklist records
  async getAllBlacklistRecords() {
    return this.prisma.blacklistRecord.findMany({
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 4. Check if a user is blacklisted
  async isUserBlacklisted(userId: string): Promise<boolean> {
    const record = await this.prisma.blacklistRecord.findFirst({
      where: { userId },
    });
    return !!record;
  }
}