import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  // 1. Create a new wallet for a user
  async createWallet(userId: string, currency: string = 'USD') {
    const existingWallet = await this.prisma.wallet.findFirst({
      where: { userId, currency },
    });

    if (existingWallet) {
      throw new ConflictException(`Wallet with currency ${currency} already exists for this user`);
    }

    return this.prisma.wallet.create({
      data: {
        userId,
        currency,
        balance: 0, // Stored in minor units (e.g., cents)
      },
    });
  }

  // 2. Get user wallets
  async getUserWallets(userId: string) {
    return this.prisma.wallet.findMany({
      where: { userId },
      include: { user: { select: { email: true, firstName: true, lastName: true, isBlocked: true } } },
    });
  }

  // 3. Secure Deposit with Transfer Ledger, Concurrency Lock, & Blacklist/Block Checks
  async deposit(walletId: string, amount: number, currency: string, idempotencyKey: string) {
    if (amount <= 0) {
      throw new BadRequestException('Deposit amount must be greater than zero');
    }

    return this.prisma.$transaction(async (tx: any) => {
      // Check idempotency key to prevent duplicate processing
      const existingTx = await tx.transfer.findUnique({
        where: { idempotencyKey },
      });
      if (existingTx) {
        return { message: 'Transfer already processed (Idempotent)', transfer: existingTx };
      }

      // Lock the wallet row and fetch user details
      const wallets = await tx.$queryRaw<any[]>`
        SELECT w.id, w."userId", w.balance, u."isBlocked" 
        FROM "wallets" w 
        JOIN "users" u ON w."userId" = u.id 
        WHERE w.id = ${walletId} 
        FOR UPDATE OF w;
      `;

      if (!wallets || wallets.length === 0) {
        throw new NotFoundException('Wallet not found');
      }

      const wallet = wallets[0];

      // Check if user is blacklisted
      const isBlacklisted = await tx.blacklistRecord.findFirst({
        where: { userId: wallet.userId },
      });
      if (isBlacklisted) {
        throw new ForbiddenException('Deposits are not permitted for blacklisted accounts.');
      }

      // Check if user is blocked
      if (wallet.isBlocked) {
        throw new ForbiddenException('Deposits are not permitted for blocked accounts');
      }

      const newBalance = Number(wallet.balance) + amount;

      // Update wallet balance
      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: newBalance },
      });

      // Record transfer according to your Transfer schema
      const transfer = await tx.transfer.create({
        data: {
          sourceWalletId: 'SYSTEM', // Represents external deposit source
          destinationWalletId: walletId,
          amount,
          currency,
          status: 'COMPLETED',
          idempotencyKey,
        },
      });

      return { message: 'Deposit successful', transfer, newBalance };
    },
    {
      maxWait: 10000, // Wait up to 10 seconds to acquire a connection slot
      timeout: 15000, // Allow up to 15 seconds for the transaction to complete
    });
  }

  async transfer(
    userId: string, // The user initiating the transfer
    sourceWalletId: string,
    destinationWalletId: string,
    amount: number,
    currency: string,
    idempotencyKey: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Transfer amount must be greater than zero');
    }

    if (sourceWalletId === destinationWalletId) {
      throw new BadRequestException('Cannot transfer funds to the same wallet');
    }

    // Sort wallet IDs to prevent database deadlocks in concurrent bi-directional transfers
    const [firstId, secondId] = [sourceWalletId, destinationWalletId].sort();

    return this.prisma.$transaction(async (tx: any) => {
      // 1. Check idempotency key
      const existingTx = await tx.transfer.findUnique({
        where: { idempotencyKey },
      });
      if (existingTx) {
        return { message: 'Transfer already processed (Idempotent)', transfer: existingTx };
      }

      // 2. Lock both wallets in deterministic order and fetch user block statuses
      const wallets = await tx.$queryRaw<any[]>`
        SELECT w.id, w."userId", w.balance, w.currency, u."isBlocked" 
        FROM "wallets" w 
        JOIN "users" u ON w."userId" = u.id 
        WHERE w.id IN (${firstId}, ${secondId}) 
        FOR UPDATE OF w;
      `;

      if (wallets.length !== 2) {
        throw new NotFoundException('One or both wallets not found');
      }

      const sourceWallet = wallets.find((w: any) => w.id === sourceWalletId);
      const destWallet = wallets.find((w: any) => w.id === destinationWalletId);

      if (!sourceWallet || !destWallet) {
        throw new NotFoundException('Wallet mapping error');
      }

      // 3. Check if either user is blacklisted
      const blacklistedRecord = await tx.blacklistRecord.findFirst({
        where: {
          userId: {
            in: [sourceWallet.userId, destWallet.userId],
          },
        },
      });

      if (blacklistedRecord) {
        throw new ForbiddenException('Transfers are not permitted for blacklisted accounts.');
      }

      // 4. Check if either user is blocked
      if (sourceWallet.isBlocked || destWallet.isBlocked) {
        throw new ForbiddenException('Transfers are not permitted for blocked accounts');
      }

      // 5. Verify ownership (ensure the user owns the source wallet)
      if (sourceWallet.userId !== userId) {
        throw new BadRequestException('You do not own the source wallet');
      }

      // 6. Verify currency match
      if (sourceWallet.currency !== currency || destWallet.currency !== currency) {
        throw new BadRequestException('Currency mismatch between wallets');
      }

      // 7. Check sufficient funds
      const currentSourceBalance = Number(sourceWallet.balance);
      if (currentSourceBalance < amount) {
        throw new BadRequestException('Insufficient funds');
      }

      const newSourceBalance = currentSourceBalance - amount;
      const newDestBalance = Number(destWallet.balance) + amount;

      // 8. Update source wallet balance
      await tx.wallet.update({
        where: { id: sourceWalletId },
        data: { balance: newSourceBalance },
      });

      // 9. Update destination wallet balance
      await tx.wallet.update({
        where: { id: destinationWalletId },
        data: { balance: newDestBalance },
      });

      // 10. Record immutable transfer entry
      const transfer = await tx.transfer.create({
        data: {
          sourceWalletId,
          destinationWalletId,
          amount,
          currency,
          status: 'COMPLETED',
          idempotencyKey,
        },
      });

      return {
        message: 'Transfer successful',
        transfer,
        sourceNewBalance: newSourceBalance,
      };
    },
    {
      maxWait: 10000, // Wait up to 10 seconds to acquire a connection slot
      timeout: 15000, // Allow up to 15 seconds for the transaction to complete
    });
  }
}