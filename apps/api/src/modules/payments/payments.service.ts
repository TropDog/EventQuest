import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { CheckoutResponse, PaymentWebhookResponse } from '@eventquest/shared';
import { PaymentProvider, PaymentStatus } from '@eventquest/shared';
import { PackagesRepository } from '../packages/packages.repository';
import { PackagesService } from '../packages/packages.service';
import { isCheckoutAvailable } from '../packages/package-definitions';
import {
  PAYMENT_PROVIDER,
  PaymentProviderAdapter,
} from './payment-provider.interface';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly packagesService: PackagesService,
    private readonly packagesRepository: PackagesRepository,
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: PaymentProviderAdapter,
  ) {}

  async createCheckout(
    organizerId: string,
    packageType: string,
  ): Promise<CheckoutResponse> {
    const definition = this.packagesService.getPackageDefinition(packageType);

    if (!isCheckoutAvailable(definition)) {
      throw new BadRequestException(
        'Selected package is not available for checkout',
      );
    }

    const purchase = await this.packagesRepository.createPurchase({
      organizer: { connect: { id: organizerId } },
      packageType: definition.type,
      participantLimit: definition.participantLimit,
      paymentStatus: PaymentStatus.PENDING,
      paymentProvider: this.resolvePaymentProviderName(),
    });

    const session = await this.paymentProvider.createCheckoutSession({
      packagePurchaseId: purchase.id,
      organizerId,
      packageType: definition.type,
      priceCents: definition.priceCents ?? 0,
      currency: definition.currency,
    });

    await this.packagesRepository.updatePurchaseSessionId(
      purchase.id,
      session.sessionId,
    );

    return {
      packagePurchaseId: purchase.id,
      checkoutSessionId: session.sessionId,
      checkoutUrl: session.checkoutUrl,
    };
  }

  async processWebhook(
    rawBody: Buffer,
    signature: string | undefined,
  ): Promise<PaymentWebhookResponse> {
    const verifiedEvent = this.paymentProvider.verifyWebhook(rawBody, signature);

    const purchase = await this.packagesRepository.findPurchaseById(
      verifiedEvent.packagePurchaseId,
    );

    if (!purchase) {
      throw new NotFoundException('Package purchase not found for webhook');
    }

    if (this.hasConflictingSessionId(purchase, verifiedEvent.sessionId)) {
      throw new UnauthorizedException('Webhook session context mismatch');
    }

    if (!verifiedEvent.isPaymentConfirmed) {
      return {
        received: true,
        processed: false,
        packagePurchaseId: purchase.id,
        paymentStatus: purchase.paymentStatus,
      };
    }

    if (
      purchase.paymentStatus === PaymentStatus.PAID ||
      purchase.paymentStatus === PaymentStatus.USED
    ) {
      return {
        received: true,
        processed: true,
        packagePurchaseId: purchase.id,
        paymentStatus: purchase.paymentStatus,
      };
    }

    if (purchase.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('Package purchase cannot be marked as paid');
    }

    const updatedCount = await this.packagesRepository.confirmPaymentIfPending({
      purchaseId: verifiedEvent.packagePurchaseId,
      sessionId: verifiedEvent.sessionId,
      purchasedAt: verifiedEvent.paidAt,
    });

    if (updatedCount === 1) {
      return {
        received: true,
        processed: true,
        packagePurchaseId: purchase.id,
        paymentStatus: PaymentStatus.PAID,
      };
    }

    const currentPurchase = await this.packagesRepository.findPurchaseById(
      verifiedEvent.packagePurchaseId,
    );

    if (!currentPurchase) {
      throw new NotFoundException('Package purchase not found for webhook');
    }

    if (this.hasConflictingSessionId(currentPurchase, verifiedEvent.sessionId)) {
      throw new UnauthorizedException('Webhook session context mismatch');
    }

    if (
      currentPurchase.paymentStatus === PaymentStatus.PAID ||
      currentPurchase.paymentStatus === PaymentStatus.USED
    ) {
      return {
        received: true,
        processed: true,
        packagePurchaseId: currentPurchase.id,
        paymentStatus: currentPurchase.paymentStatus,
      };
    }

    throw new BadRequestException('Package purchase cannot be marked as paid');
  }

  private hasConflictingSessionId(
    purchase: { paymentProviderSessionId: string | null },
    sessionId: string,
  ): boolean {
    return (
      purchase.paymentProviderSessionId !== null &&
      purchase.paymentProviderSessionId !== sessionId
    );
  }

  private resolvePaymentProviderName(): string {
    return this.paymentProvider.providerName === PaymentProvider.STRIPE
      ? PaymentProvider.STRIPE
      : PaymentProvider.PLACEHOLDER;
  }
}
