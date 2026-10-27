import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsString, IsNumber, IsPositive, IsOptional } from 'class-validator';

class CreateWalletDto {
  @IsString()
  @IsOptional()
  currency?: string;
}

class DepositDto {
  @IsString()
  walletId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  idempotencyKey: string;
}

class TransferDto {
  @IsString()
  sourceWalletId: string;

  @IsString()
  destinationWalletId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  idempotencyKey: string;
}

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  async createWallet(@Req() req: any, @Body() dto: CreateWalletDto) {
    return this.walletsService.createWallet(req.user.id, dto.currency || 'USD');
  }

  @Get()
  async getUserWallets(@Req() req: any) {
    return this.walletsService.getUserWallets(req.user.id);
  }

  @Post('deposit')
  async deposit(@Body() dto: DepositDto) {
    return this.walletsService.deposit(
      dto.walletId,
      dto.amount,
      dto.idempotencyKey,
      dto.currency,
    );
  }

  @Post('transfer')
  async transfer(@Req() req: any, @Body() dto: TransferDto) {
    return this.walletsService.transfer(
      req.user.id,
      dto.sourceWalletId,
      dto.destinationWalletId,
      dto.amount,
      dto.currency,
      dto.idempotencyKey,
    );
  }
}