import { Controller, Patch, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
// Add your JwtAuthGuard and potential AdminGuard here if required

@Controller('users')
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
