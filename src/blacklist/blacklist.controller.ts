import { Controller, Post, Get, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { BlacklistService } from './blacklist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guards';
import { Roles } from '../auth/decorators/roles.decorators';
import { Role } from '@prisma/client';

@Controller('admin/blacklist')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class BlacklistController {
  constructor(private readonly blacklistService: BlacklistService) {}

  @Post()
  async blacklistUser(
    @Body('userId') userId: string,
    @Body('adminId') adminId: string,
    @Body('reason') reason: string,
  ) {
    return this.blacklistService.blacklistUser(userId, adminId, reason);
  }

  @Get()
  async getBlacklist() {
    return this.blacklistService.getAllBlacklistRecords();
  }

  @Delete(':id')
  async removeFromBlacklist(@Param('id') id: string) {
    return this.blacklistService.removeFromBlacklist(id);
  }
}