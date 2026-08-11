import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PAYMENT_PROVIDER,
  PaymentProviderAdapter,
} from './payment-provider.interface';
import { PlaceholderPaymentProvider } from './placeholder-payment.provider';
import { StripePaymentProvider } from './stripe-payment.provider';

export const paymentProviderFactory: Provider = {
  provide: PAYMENT_PROVIDER,
  inject: [ConfigService, PlaceholderPaymentProvider, StripePaymentProvider],
  useFactory: (
    configService: ConfigService,
    placeholderProvider: PlaceholderPaymentProvider,
    stripeProvider: StripePaymentProvider,
  ): PaymentProviderAdapter => {
    const provider = configService.get<string>('payments.provider', 'placeholder');

    if (provider === 'stripe') {
      return stripeProvider;
    }

    return placeholderProvider;
  },
};
