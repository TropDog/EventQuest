import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
  PaymentProviderAdapter,
  VerifiedPaymentEvent,
} from './payment-provider.interface';

@Injectable()
export class StripePaymentProvider implements PaymentProviderAdapter {
  readonly providerName = 'stripe';
  private stripeClient: Stripe | null = null;

  constructor(private readonly configService: ConfigService) {}

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionResult> {
    const session = await this.getStripeClient().checkout.sessions.create({
      mode: 'payment',
      success_url: this.configService.get<string>(
        'payments.checkoutSuccessUrl',
        'http://localhost:3000/packages?checkout=success',
      ),
      cancel_url: this.configService.get<string>(
        'payments.checkoutCancelUrl',
        'http://localhost:3000/packages?checkout=cancelled',
      ),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: input.priceCents,
            product_data: {
              name: `EventQuest ${input.packageType} package`,
            },
          },
        },
      ],
      metadata: {
        packagePurchaseId: input.packagePurchaseId,
        organizerId: input.organizerId,
        packageType: input.packageType,
      },
    });

    if (!session.id) {
      throw new Error('Stripe checkout session did not return an id');
    }

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
    };
  }

  verifyWebhook(
    rawBody: Buffer,
    signature: string | undefined,
  ): VerifiedPaymentEvent {
    if (!signature) {
      throw new UnauthorizedException('Missing Stripe webhook signature');
    }

    const webhookSecret = this.configService.get<string>(
      'payments.stripeWebhookSecret',
    );
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    let event: Stripe.Event;
    try {
      event = this.getStripeClient().webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch {
      throw new UnauthorizedException('Invalid Stripe webhook signature');
    }

    if (event.type !== 'checkout.session.completed') {
      throw new UnauthorizedException('Unsupported Stripe webhook event');
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const packagePurchaseId = session.metadata?.packagePurchaseId;

    if (!session.id || !packagePurchaseId) {
      throw new UnauthorizedException('Stripe webhook missing purchase context');
    }

    return {
      sessionId: session.id,
      packagePurchaseId,
      paidAt: new Date(event.created * 1000),
      isPaymentConfirmed: session.payment_status === 'paid',
    };
  }

  private getStripeClient(): Stripe {
    if (this.stripeClient) {
      return this.stripeClient;
    }

    const secretKey = this.configService.get<string>('payments.stripeSecretKey');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripeClient = new Stripe(secretKey);
    return this.stripeClient;
  }
}
