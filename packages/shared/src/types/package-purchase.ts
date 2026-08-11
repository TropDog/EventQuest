export interface PackageDefinition {
  type: string;
  name: string;
  description: string;
  participantLimit: number | null;
  /** Null means price is not configured; checkout is unavailable for that tier. */
  priceCents: number | null;
  currency: string;
}

export interface PackagePurchaseSummary {
  id: string;
  packageType: string;
  participantLimit: number | null;
  paymentStatus: string;
  paymentProvider: string | null;
  purchasedAt: string | null;
  usedAt: string | null;
  createdAt: string;
}

export interface CheckoutResponse {
  packagePurchaseId: string;
  checkoutSessionId: string;
  checkoutUrl: string | null;
}

export interface PaymentWebhookResponse {
  received: true;
  processed: boolean;
  packagePurchaseId: string;
  paymentStatus: string;
}
