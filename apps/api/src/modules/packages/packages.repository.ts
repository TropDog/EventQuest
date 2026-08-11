import { Injectable } from '@nestjs/common';
import { PackagePurchase, Prisma } from '@prisma/client';
import { PaymentStatus } from '@eventquest/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PackagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPurchasesByOrganizerId(organizerId: string): Promise<PackagePurchase[]> {
    return this.prisma.packagePurchase.findMany({
      where: { organizerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findPurchaseById(id: string): Promise<PackagePurchase | null> {
    return this.prisma.packagePurchase.findUnique({
      where: { id },
    });
  }

  findPurchaseBySessionId(
    sessionId: string,
  ): Promise<PackagePurchase | null> {
    return this.prisma.packagePurchase.findUnique({
      where: { paymentProviderSessionId: sessionId },
    });
  }

  createPurchase(
    data: Prisma.PackagePurchaseCreateInput,
  ): Promise<PackagePurchase> {
    return this.prisma.packagePurchase.create({ data });
  }

  /**
   * Binds the provider session id only while the purchase is still PENDING.
   * No-op when the purchase is already PAID/USED (e.g. webhook won the race).
   */
  updatePurchaseSessionId(id: string, sessionId: string): Promise<number> {
    return this.prisma.packagePurchase
      .updateMany({
        where: {
          id,
          paymentStatus: PaymentStatus.PENDING,
          OR: [
            { paymentProviderSessionId: null },
            { paymentProviderSessionId: sessionId },
          ],
        },
        data: { paymentProviderSessionId: sessionId },
      })
      .then((result) => result.count);
  }

  /**
   * Atomically transitions PENDING → PAID and binds the provider session id
   * when it has not yet been persisted (checkout/webhook race safe).
   */
  confirmPaymentIfPending(params: {
    purchaseId: string;
    sessionId: string;
    purchasedAt: Date;
  }): Promise<number> {
    return this.prisma.packagePurchase
      .updateMany({
        where: {
          id: params.purchaseId,
          paymentStatus: PaymentStatus.PENDING,
          OR: [
            { paymentProviderSessionId: null },
            { paymentProviderSessionId: params.sessionId },
          ],
        },
        data: {
          paymentStatus: PaymentStatus.PAID,
          purchasedAt: params.purchasedAt,
          paymentProviderSessionId: params.sessionId,
        },
      })
      .then((result) => result.count);
  }

  /**
   * Atomically transitions PAID → USED for a single organizer-owned purchase.
   */
  markPurchaseUsedIfPaid(params: {
    purchaseId: string;
    organizerId: string;
    usedAt: Date;
  }): Promise<number> {
    return this.prisma.packagePurchase
      .updateMany({
        where: {
          id: params.purchaseId,
          organizerId: params.organizerId,
          paymentStatus: PaymentStatus.PAID,
          usedAt: null,
        },
        data: {
          paymentStatus: PaymentStatus.USED,
          usedAt: params.usedAt,
        },
      })
      .then((result) => result.count);
  }
}
