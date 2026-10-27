import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { HealthController } from './health.controller';
import { UsersModule } from './users/users.module';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { AuthModule } from './auth/auth.module';
import { AuthController } from './auth.controller';
import { WalletsModule } from './wallets/wallets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: {
        
      },
    }),
    HealthModule,
    UsersModule,
    AuthModule,
    WalletsModule,
  ],
  controllers: [HealthController, AuthController, UsersController],
  providers: [
    UsersService],
})
export class AppModule {}