import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
  PaymentProviderAdapter,
  VerifiedPaymentEvent,
} from './payment-provider.interface';

interface PlaceholderWebhookPayload {
  type: 'checkout.session.completed';
  sessionId: string;
  packagePurchaseId: string;
}

@Injectable()
export class PlaceholderPaymentProvider implements PaymentProviderAdapter {
  readonly providerName = 'placeholder';

  constructor(private readonly configService: ConfigService) {}

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionResult> {
    const sessionId = `placeholder_cs_${randomBytes(16).toString('hex')}`;

    return {
      sessionId,
      checkoutUrl: null,
    };
  }

  verifyWebhook(
    rawBody: Buffer,
    signature: string | undefined,
  ): VerifiedPaymentEvent {
    const webhookSecret = this.getWebhookSecret();
    this.assertValidSignature(rawBody, signature, webhookSecret);

    let payload: PlaceholderWebhookPayload;
    try {
      payload = JSON.parse(rawBody.toString('utf8')) as PlaceholderWebhookPayload;
    } catch {
      throw new UnauthorizedException('Invalid webhook payload');
    }

    if (
      payload.type !== 'checkout.session.completed' ||
      !payload.sessionId ||
      !payload.packagePurchaseId
    ) {
      throw new UnauthorizedException('Unsupported webhook event');
    }

    return {
      sessionId: payload.sessionId,
      packagePurchaseId: payload.packagePurchaseId,
      paidAt: new Date(),
      isPaymentConfirmed: true,
    };
  }

  createWebhookSignature(rawBody: Buffer): string {
    return createHmac('sha256', this.getWebhookSecret())
      .update(rawBody)
      .digest('hex');
  }

  private getWebhookSecret(): string {
    const secret = this.configService.get<string>('payments.webhookSecret');
    if (!secret) {
      throw new Error('PAYMENTS_WEBHOOK_SECRET is not configured');
    }

    return secret;
  }

  private assertValidSignature(
    rawBody: Buffer,
    signature: string | undefined,
    secret: string,
  ): void {
    if (!signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');

    const provided = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');

    if (
      provided.length !== expectedBuffer.length ||
      !timingSafeEqual(provided, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }
}
