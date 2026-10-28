import { Controller, Patch, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guards';
import { Roles } from '../auth/decorators/roles.decorators';
import { UserRole } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch(':id/block')
  // @UseGuards(JwtAuthGuard, AdminGuard) // Uncomment when you have auth/admin guards set up
  async blockUser(@Param('id') id: string) {
    return this.usersService.blockUser(id);
  }

  @Patch(':id/unblock')
  // @UseGuards(JwtAuthGuard, AdminGuard) // Uncomment when you have auth/admin guards set up
  async unblockUser(@Param('id') id: string) {
    return this.usersService.unblockUser(id);
  }
}
