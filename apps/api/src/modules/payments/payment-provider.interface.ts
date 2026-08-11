export interface CreateCheckoutSessionInput {
  packagePurchaseId: string;
  organizerId: string;
  packageType: string;
  priceCents: number;
  currency: string;
}

export interface CreateCheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string | null;
}

export interface VerifiedPaymentEvent {
  sessionId: string;
  packagePurchaseId: string;
  paidAt: Date;
  isPaymentConfirmed: boolean;
}

export interface PaymentProviderAdapter {
  readonly providerName: string;

  createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionResult>;

  verifyWebhook(
    rawBody: Buffer,
    signature: string | undefined,
  ): VerifiedPaymentEvent;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
