import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PackageDefinition, PackagePurchaseSummary } from '@eventquest/shared';
import { PaymentStatus } from '@eventquest/shared';
import {
  findPackageDefinition,
  PACKAGE_DEFINITIONS,
} from './package-definitions';
import { PackagesRepository } from './packages.repository';
import {
  isAvailableForEventCreation,
  isUsedPurchase,
  toPackagePurchaseSummary,
} from './dto/package-purchase.mapper';

@Injectable()
export class PackagesService {
  constructor(private readonly packagesRepository: PackagesRepository) {}

  listPackageDefinitions(): PackageDefinition[] {
    return PACKAGE_DEFINITIONS;
  }

  getPackageDefinition(packageType: string): PackageDefinition {
    const definition = findPackageDefinition(packageType);
    if (!definition) {
      throw new BadRequestException('Invalid package type');
    }

    return definition;
  }

  async listOrganizerPurchases(
    organizerId: string,
  ): Promise<PackagePurchaseSummary[]> {
    const purchases =
      await this.packagesRepository.findPurchasesByOrganizerId(organizerId);

    return purchases.map(toPackagePurchaseSummary);
  }

  async getOrganizerPurchase(
    organizerId: string,
    purchaseId: string,
  ): Promise<PackagePurchaseSummary> {
    const purchase = await this.packagesRepository.findPurchaseById(purchaseId);

    if (!purchase || purchase.organizerId !== organizerId) {
      throw new NotFoundException('Package purchase not found');
    }

    return toPackagePurchaseSummary(purchase);
  }

  async assertPackageAvailableForEventCreation(
    organizerId: string,
    purchaseId: string,
  ): Promise<PackagePurchaseSummary> {
    const purchase = await this.packagesRepository.findPurchaseById(purchaseId);

    if (!purchase || purchase.organizerId !== organizerId) {
      throw new NotFoundException('Package purchase not found');
    }

    if (isUsedPurchase(purchase)) {
      throw new BadRequestException('Package purchase has already been used');
    }

    if (!isAvailableForEventCreation(purchase)) {
      throw new BadRequestException(
        'Package purchase is not available for event creation',
      );
    }

    return toPackagePurchaseSummary(purchase);
  }

  async markPackageAsUsed(
    organizerId: string,
    purchaseId: string,
  ): Promise<PackagePurchaseSummary> {
    const purchase = await this.packagesRepository.findPurchaseById(purchaseId);

    if (!purchase || purchase.organizerId !== organizerId) {
      throw new NotFoundException('Package purchase not found');
    }

    if (isUsedPurchase(purchase)) {
      throw new BadRequestException('Package purchase has already been used');
    }

    const usedAt = new Date();
    const updatedCount = await this.packagesRepository.markPurchaseUsedIfPaid({
      purchaseId,
      organizerId,
      usedAt,
    });

    if (updatedCount === 1) {
      const updated = await this.packagesRepository.findPurchaseById(purchaseId);
      return toPackagePurchaseSummary(updated!);
    }

    const currentPurchase =
      await this.packagesRepository.findPurchaseById(purchaseId);

    if (!currentPurchase || currentPurchase.organizerId !== organizerId) {
      throw new NotFoundException('Package purchase not found');
    }

    if (isUsedPurchase(currentPurchase)) {
      throw new BadRequestException('Package purchase has already been used');
    }

    throw new BadRequestException(
      'Only paid package purchases can be marked as used',
    );
  }

  getParticipantLimitForPurchase(purchaseId: string): Promise<number | null> {
    return this.packagesRepository
      .findPurchaseById(purchaseId)
      .then((purchase) => purchase?.participantLimit ?? null);
  }
}
