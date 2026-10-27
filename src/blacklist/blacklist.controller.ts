import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { BlacklistService } from './blacklist.service';

@Controller('admin/blacklist')
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