import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus } from '@eventquest/shared';
import { PackagesService } from './packages.service';
import { PackagesRepository } from './packages.repository';

describe('PackagesService', () => {
  let service: PackagesService;
  let repository: jest.Mocked<PackagesRepository>;

  beforeEach(() => {
    repository = {
      findPurchasesByOrganizerId: jest.fn(),
      findPurchaseById: jest.fn(),
      findPurchaseBySessionId: jest.fn(),
      createPurchase: jest.fn(),
      updatePurchaseSessionId: jest.fn(),
      confirmPaymentIfPending: jest.fn(),
      markPurchaseUsedIfPaid: jest.fn(),
    } as unknown as jest.Mocked<PackagesRepository>;

    service = new PackagesService(repository);
  });

  it('lists configured package definitions from PRD tiers', () => {
    const packages = service.listPackageDefinitions();

    expect(packages.map((pkg) => pkg.type)).toEqual([
      'FREE',
      'BASIC',
      'PREMIUM',
      'UNLIMITED',
    ]);
    expect(packages.find((pkg) => pkg.type === 'FREE')?.participantLimit).toBe(20);
    expect(packages.find((pkg) => pkg.type === 'PREMIUM')?.participantLimit).toBe(
      100,
    );
    expect(
      packages.find((pkg) => pkg.type === 'UNLIMITED')?.participantLimit,
    ).toBeNull();
  });

  it('rejects invalid package types during checkout validation', () => {
    expect(() => service.getPackageDefinition('UNKNOWN')).toThrow(
      BadRequestException,
    );
  });

  it('returns only organizer-owned purchases', async () => {
    repository.findPurchasesByOrganizerId.mockResolvedValue([
      {
        id: 'purchase-1',
        organizerId: 'org-1',
        packageType: 'FREE',
        participantLimit: 20,
        paymentStatus: PaymentStatus.PAID,
        paymentProvider: 'placeholder',
        paymentProviderSessionId: 'session-1',
        purchasedAt: new Date('2026-01-01T00:00:00.000Z'),
        usedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ] as never);

    const purchases = await service.listOrganizerPurchases('org-1');

    expect(purchases).toHaveLength(1);
    expect(purchases[0].paymentStatus).toBe(PaymentStatus.PAID);
  });

  it('marks a paid package as used atomically', async () => {
    repository.findPurchaseById
      .mockResolvedValueOnce({
        id: 'purchase-1',
        organizerId: 'org-1',
        packageType: 'FREE',
        participantLimit: 20,
        paymentStatus: PaymentStatus.PAID,
        paymentProvider: 'placeholder',
        paymentProviderSessionId: 'session-1',
        purchasedAt: new Date(),
        usedAt: null,
        createdAt: new Date(),
      } as never)
      .mockResolvedValueOnce({
        id: 'purchase-1',
        organizerId: 'org-1',
        packageType: 'FREE',
        participantLimit: 20,
        paymentStatus: PaymentStatus.USED,
        paymentProvider: 'placeholder',
        paymentProviderSessionId: 'session-1',
        purchasedAt: new Date(),
        usedAt: new Date('2026-01-02T00:00:00.000Z'),
        createdAt: new Date(),
      } as never);

    repository.markPurchaseUsedIfPaid.mockResolvedValue(1);

    const result = await service.markPackageAsUsed('org-1', 'purchase-1');

    expect(result.paymentStatus).toBe(PaymentStatus.USED);
    expect(repository.markPurchaseUsedIfPaid).toHaveBeenCalled();
  });

  it('rejects package reuse', async () => {
    repository.findPurchaseById.mockResolvedValue({
      id: 'purchase-1',
      organizerId: 'org-1',
      packageType: 'FREE',
      participantLimit: 20,
      paymentStatus: PaymentStatus.USED,
      paymentProvider: 'placeholder',
      paymentProviderSessionId: 'session-1',
      purchasedAt: new Date(),
      usedAt: new Date(),
      createdAt: new Date(),
    } as never);

    await expect(
      service.assertPackageAvailableForEventCreation('org-1', 'purchase-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('hides purchases belonging to another organizer', async () => {
    repository.findPurchaseById.mockResolvedValue({
      id: 'purchase-1',
      organizerId: 'org-2',
      packageType: 'FREE',
      participantLimit: 20,
      paymentStatus: PaymentStatus.PAID,
      paymentProvider: 'placeholder',
      paymentProviderSessionId: 'session-1',
      purchasedAt: new Date(),
      usedAt: null,
      createdAt: new Date(),
    } as never);

    await expect(
      service.getOrganizerPurchase('org-1', 'purchase-1'),
    ).rejects.toThrow(NotFoundException);
  });
});
