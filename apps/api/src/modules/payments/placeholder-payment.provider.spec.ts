import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlaceholderPaymentProvider } from './placeholder-payment.provider';

describe('PlaceholderPaymentProvider', () => {
  let provider: PlaceholderPaymentProvider;

  beforeEach(() => {
    provider = new PlaceholderPaymentProvider(
      {
        get: jest.fn().mockReturnValue('test-webhook-secret'),
      } as unknown as ConfigService,
    );
  });

  it('creates placeholder checkout sessions', async () => {
    const session = await provider.createCheckoutSession({
      packagePurchaseId: 'purchase-1',
      organizerId: 'org-1',
      packageType: 'STANDARD',
      priceCents: 9900,
      currency: 'PLN',
    });

    expect(session.sessionId).toMatch(/^placeholder_cs_/);
  });

  it('verifies signed webhook payloads', () => {
    const payload = Buffer.from(
      JSON.stringify({
        type: 'checkout.session.completed',
        sessionId: 'session-1',
        packagePurchaseId: 'purchase-1',
      }),
    );
    const signature = provider.createWebhookSignature(payload);

    const verified = provider.verifyWebhook(payload, signature);

    expect(verified).toEqual({
      sessionId: 'session-1',
      packagePurchaseId: 'purchase-1',
      paidAt: expect.any(Date),
      isPaymentConfirmed: true,
    });
  });

  it('rejects invalid webhook signatures', () => {
    const payload = Buffer.from(
      JSON.stringify({
        type: 'checkout.session.completed',
        sessionId: 'session-1',
        packagePurchaseId: 'purchase-1',
      }),
    );

    expect(() => provider.verifyWebhook(payload, 'invalid-signature')).toThrow(
      UnauthorizedException,
    );
  });
});
