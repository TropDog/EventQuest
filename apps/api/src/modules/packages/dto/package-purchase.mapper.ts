import type { PackagePurchase } from '@prisma/client';
import type { PackagePurchaseSummary } from '@eventquest/shared';
import { PaymentStatus } from '@eventquest/shared';

export function toPackagePurchaseSummary(
  purchase: PackagePurchase,
): PackagePurchaseSummary {
  return {
    id: purchase.id,
    packageType: purchase.packageType,
    participantLimit: purchase.participantLimit,
    paymentStatus: purchase.paymentStatus,
    paymentProvider: purchase.paymentProvider,
    purchasedAt: purchase.purchasedAt?.toISOString() ?? null,
    usedAt: purchase.usedAt?.toISOString() ?? null,
    createdAt: purchase.createdAt.toISOString(),
  };
}

export function isPaidPurchase(purchase: PackagePurchase): boolean {
  return purchase.paymentStatus === PaymentStatus.PAID;
}

export function isUsedPurchase(purchase: PackagePurchase): boolean {
  return (
    purchase.paymentStatus === PaymentStatus.USED || purchase.usedAt !== null
  );
}

export function isAvailableForEventCreation(
  purchase: PackagePurchase,
): boolean {
  return isPaidPurchase(purchase) && !isUsedPurchase(purchase);
}
