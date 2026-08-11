import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripePaymentProvider } from './stripe-payment.provider';

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

describe('StripePaymentProvider', () => {
  let provider: StripePaymentProvider;
  let constructEvent: jest.Mock;

  beforeEach(() => {
    constructEvent = jest.fn();
    (Stripe as unknown as jest.Mock).mockImplementation(() => ({
      webhooks: { constructEvent },
    }));

    provider = new StripePaymentProvider({
      get: jest.fn((key: string) => {
        if (key === 'payments.stripeWebhookSecret') {
          return 'whsec_test';
        }
        if (key === 'payments.stripeSecretKey') {
          return 'sk_test';
        }
        return undefined;
      }),
    } as unknown as ConfigService);
  });

  it('treats checkout.session.completed with paid status as confirmed', () => {
    constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      created: 1_700_000_000,
      data: {
        object: {
          id: 'cs_test_paid',
          payment_status: 'paid',
          metadata: { packagePurchaseId: 'purchase-1' },
        },
      },
    });

    const verified = provider.verifyWebhook(Buffer.from('{}'), 'sig_test');

    expect(verified.isPaymentConfirmed).toBe(true);
    expect(verified.sessionId).toBe('cs_test_paid');
    expect(verified.packagePurchaseId).toBe('purchase-1');
  });

  it('does not treat checkout.session.completed with unpaid status as confirmed', () => {
    constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      created: 1_700_000_000,
      data: {
        object: {
          id: 'cs_test_unpaid',
          payment_status: 'unpaid',
          metadata: { packagePurchaseId: 'purchase-1' },
        },
      },
    });

    const verified = provider.verifyWebhook(Buffer.from('{}'), 'sig_test');

    expect(verified.isPaymentConfirmed).toBe(false);
  });

  it('rejects invalid webhook signatures', () => {
    constructEvent.mockImplementation(() => {
      throw new Error('invalid signature');
    });

    expect(() => provider.verifyWebhook(Buffer.from('{}'), 'bad_sig')).toThrow(
      UnauthorizedException,
    );
  });
});
