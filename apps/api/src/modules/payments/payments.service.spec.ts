import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentStatus } from '@eventquest/shared';
import { PaymentsService } from './payments.service';
import { PackagesService } from '../packages/packages.service';
import { PackagesRepository } from '../packages/packages.repository';
import { PaymentProviderAdapter } from './payment-provider.interface';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let packagesService: jest.Mocked<PackagesService>;
  let packagesRepository: jest.Mocked<PackagesRepository>;
  let paymentProvider: jest.Mocked<PaymentProviderAdapter>;

  beforeEach(() => {
    packagesService = {
      getPackageDefinition: jest.fn().mockReturnValue({
        type: 'FREE',
        name: 'Free',
        description: 'Free package',
        participantLimit: 20,
        priceCents: 0,
        currency: 'PLN',
      }),
    } as unknown as jest.Mocked<PackagesService>;

    packagesRepository = {
      createPurchase: jest.fn(),
      updatePurchaseSessionId: jest.fn(),
      findPurchaseById: jest.fn(),
      confirmPaymentIfPending: jest.fn(),
    } as unknown as jest.Mocked<PackagesRepository>;

    paymentProvider = {
      providerName: 'placeholder',
      createCheckoutSession: jest.fn(),
      verifyWebhook: jest.fn(),
    };

    service = new PaymentsService(
      packagesService,
      packagesRepository,
      paymentProvider,
    );
  });

  it('creates checkout with pending purchase and provider session', async () => {
    packagesRepository.createPurchase.mockResolvedValue({
      id: 'purchase-1',
      organizerId: 'org-1',
      packageType: 'FREE',
      participantLimit: 20,
      paymentStatus: PaymentStatus.PENDING,
      paymentProvider: 'placeholder',
      paymentProviderSessionId: null,
      purchasedAt: null,
      usedAt: null,
      createdAt: new Date(),
    } as never);

    paymentProvider.createCheckoutSession.mockResolvedValue({
      sessionId: 'session-1',
      checkoutUrl: null,
    });

    packagesRepository.updatePurchaseSessionId.mockResolvedValue(1);

    const result = await service.createCheckout('org-1', 'FREE');

    expect(result).toEqual({
      packagePurchaseId: 'purchase-1',
      checkoutSessionId: 'session-1',
      checkoutUrl: null,
    });
  });

  it('rejects checkout for packages without configured pricing', async () => {
    packagesService.getPackageDefinition.mockReturnValue({
      type: 'PREMIUM',
      name: 'Premium',
      description: 'Premium package',
      participantLimit: 100,
      priceCents: null,
      currency: 'PLN',
    });

    await expect(service.createCheckout('org-1', 'PREMIUM')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('marks purchase as paid from verified webhook using purchase id lookup', async () => {
    paymentProvider.verifyWebhook.mockReturnValue({
      sessionId: 'session-1',
      packagePurchaseId: 'purchase-1',
      paidAt: new Date('2026-01-01T00:00:00.000Z'),
      isPaymentConfirmed: true,
    });

    packagesRepository.findPurchaseById.mockResolvedValue({
      id: 'purchase-1',
      organizerId: 'org-1',
      packageType: 'FREE',
      participantLimit: 20,
      paymentStatus: PaymentStatus.PENDING,
      paymentProvider: 'placeholder',
      paymentProviderSessionId: null,
      purchasedAt: null,
      usedAt: null,
      createdAt: new Date(),
    } as never);

    packagesRepository.confirmPaymentIfPending.mockResolvedValue(1);

    const result = await service.processWebhook(Buffer.from('{}'), 'signature');

    expect(result).toEqual({
      received: true,
      processed: true,
      packagePurchaseId: 'purchase-1',
      paymentStatus: PaymentStatus.PAID,
    });
    expect(packagesRepository.confirmPaymentIfPending).toHaveBeenCalledWith({
      purchaseId: 'purchase-1',
      sessionId: 'session-1',
      purchasedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
  });

  it('does not mark purchase as paid when payment is not confirmed', async () => {
    paymentProvider.verifyWebhook.mockReturnValue({
      sessionId: 'session-1',
      packagePurchaseId: 'purchase-1',
      paidAt: new Date(),
      isPaymentConfirmed: false,
    });

    packagesRepository.findPurchaseById.mockResolvedValue({
      id: 'purchase-1',
      paymentStatus: PaymentStatus.PENDING,
      paymentProviderSessionId: null,
    } as never);

    const result = await service.processWebhook(Buffer.from('{}'), 'signature');

    expect(result).toEqual({
      received: true,
      processed: false,
      packagePurchaseId: 'purchase-1',
      paymentStatus: PaymentStatus.PENDING,
    });
    expect(packagesRepository.confirmPaymentIfPending).not.toHaveBeenCalled();
  });

  it('replays webhook idempotently for already paid purchases', async () => {
    paymentProvider.verifyWebhook.mockReturnValue({
      sessionId: 'session-1',
      packagePurchaseId: 'purchase-1',
      paidAt: new Date(),
      isPaymentConfirmed: true,
    });

    packagesRepository.findPurchaseById.mockResolvedValue({
      id: 'purchase-1',
      paymentStatus: PaymentStatus.PAID,
      paymentProviderSessionId: 'session-1',
    } as never);

    const result = await service.processWebhook(Buffer.from('{}'), 'signature');

    expect(result.processed).toBe(true);
    expect(result.paymentStatus).toBe(PaymentStatus.PAID);
    expect(packagesRepository.confirmPaymentIfPending).not.toHaveBeenCalled();
  });

  it('handles concurrent webhook confirmation with a single atomic transition', async () => {
    paymentProvider.verifyWebhook.mockReturnValue({
      sessionId: 'session-1',
      packagePurchaseId: 'purchase-1',
      paidAt: new Date('2026-01-01T00:00:00.000Z'),
      isPaymentConfirmed: true,
    });

    packagesRepository.findPurchaseById
      .mockResolvedValueOnce({
        id: 'purchase-1',
        paymentStatus: PaymentStatus.PENDING,
        paymentProviderSessionId: 'session-1',
      } as never)
      .mockResolvedValueOnce({
        id: 'purchase-1',
        paymentStatus: PaymentStatus.PENDING,
        paymentProviderSessionId: 'session-1',
      } as never)
      .mockResolvedValueOnce({
        id: 'purchase-1',
        paymentStatus: PaymentStatus.PAID,
        paymentProviderSessionId: 'session-1',
      } as never);

    packagesRepository.confirmPaymentIfPending
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);

    const [first, second] = await Promise.all([
      service.processWebhook(Buffer.from('{}'), 'signature'),
      service.processWebhook(Buffer.from('{}'), 'signature'),
    ]);

    expect(first.processed).toBe(true);
    expect(first.paymentStatus).toBe(PaymentStatus.PAID);
    expect(second.processed).toBe(true);
    expect(second.paymentStatus).toBe(PaymentStatus.PAID);
    expect(packagesRepository.confirmPaymentIfPending).toHaveBeenCalledTimes(2);
  });

  it('rejects webhook when persisted session id conflicts', async () => {
    paymentProvider.verifyWebhook.mockReturnValue({
      sessionId: 'session-2',
      packagePurchaseId: 'purchase-1',
      paidAt: new Date(),
      isPaymentConfirmed: true,
    });

    packagesRepository.findPurchaseById.mockResolvedValue({
      id: 'purchase-1',
      paymentStatus: PaymentStatus.PENDING,
      paymentProviderSessionId: 'session-1',
    } as never);

    await expect(
      service.processWebhook(Buffer.from('{}'), 'signature'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects webhook when purchase is not found', async () => {
    paymentProvider.verifyWebhook.mockReturnValue({
      sessionId: 'missing-session',
      packagePurchaseId: 'purchase-1',
      paidAt: new Date(),
      isPaymentConfirmed: true,
    });

    packagesRepository.findPurchaseById.mockResolvedValue(null);

    await expect(
      service.processWebhook(Buffer.from('{}'), 'signature'),
    ).rejects.toThrow(NotFoundException);
  });
});
